/**
 * Standalone Invoice Text & Table Parsing Utility
 * Extracted from client/src/utils/invoiceParser.js for zero-dependency execution
 * inside serverless containers (Vercel Node.js runtime).
 */

function normalizeDate(rawDate) {
  if (!rawDate) return '';
  const rawTrimmed = rawDate.trim();
  
  // Check for MMM-YYYY or MMM YYYY (e.g. Aug-2027, Aug 2027, Aug/2027)
  const mmmMatch = rawTrimmed.match(/^([A-Za-z]{3})[\s\/\.-]+(\d{2,4})$/);
  if (mmmMatch) {
    const months = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
    const mStr = mmmMatch[1].toLowerCase();
    const mm = months[mStr] || '01';
    let yy = mmmMatch[2];
    if (yy.length === 2) yy = '20' + yy;
    return `${yy}-${mm}-28`;
  }

  const clean = rawTrimmed.replace(/[^\d\/\.-]/g, '');

  // Full date: DD/MM/YYYY or YYYY-MM-DD
  const fullMatch = clean.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (fullMatch) {
    let [, day, month, year] = fullMatch;
    if (year.length === 2) year = '20' + year;
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Month-Year expiry: MM/YY or MM/YYYY (e.g. 08/28 or 12/2027)
  const myMatch = clean.match(/^(\d{1,2})[\/\.-](\d{2,4})$/);
  if (myMatch) {
    let [, month, year] = myMatch;
    if (year.length === 2) year = '20' + year;
    month = month.padStart(2, '0');
    return `${year}-${month}-28`;
  }

  return '';
}

function scoreMedicineMatches(rawLine, medicines) {
  if (!medicines || !medicines.length || !rawLine) {
    return { topMatch: null, candidates: [], isConfident: false };
  }
  const lineLower = rawLine.toLowerCase();
  const scored = [];

  for (const m of medicines) {
    const medNameLower = (m.name || '').toLowerCase();
    const companyLower = (m.company || '').toLowerCase();

    let score = 0;
    // Direct substring match
    if (medNameLower && lineLower.includes(medNameLower)) {
      score += 60;
    }

    // Word token match
    const words = medNameLower.split(/\s+/).filter((w) => w.length > 2);
    let matchedWords = 0;
    for (const w of words) {
      if (lineLower.includes(w)) {
        score += 25;
        matchedWords++;
      }
    }
    if (words.length > 0 && matchedWords === words.length) {
      score += 20;
    }

    if (companyLower && lineLower.includes(companyLower)) {
      score += 15;
    }

    if (score >= 25) {
      scored.push({
        medicine: m,
        score,
        id: m.id,
        name: m.name,
        company: m.company || '',
        buy_price: m.buy_price,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 3);
  const topMatch = candidates[0] || null;
  const isConfident = !!(topMatch && topMatch.score >= 60);

  return {
    topMatch,
    candidates,
    isConfident,
  };
}

function parseInvoiceText(rawText, medicinesList = []) {
  if (!rawText) {
    return {
      supplier_name: '',
      invoice_number: '',
      date: '',
      total: 0,
      items: []
    };
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let supplier_name = '';
  let invoice_number = '';
  let date = '';
  const parsedItems = [];

  // 1. Extract Invoice Number
  for (const line of lines) {
    const invMatch = line.match(/\b(?:invoice|inv|bill|vch)\s*(?:no|num|#)[\s:\.-]*([A-Z0-9\-\/]{3,20})/i)
      || line.match(/\b(?:invoice|inv|bill|vch)[\s:\.-]+([A-Z0-9\-\/]{3,20})/i);
    if (invMatch) {
      invoice_number = invMatch[1].replace(/[^A-Za-z0-9\-\/]/g, '');
      break;
    }
  }

  // 2. Extract Date
  for (const line of lines) {
    const dateMatch = line.match(/\b(?:date|dt)[\s:\.]*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i)
      || line.match(/\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/);
    if (dateMatch) {
      date = normalizeDate(dateMatch[1]);
      if (date) break;
    }
  }

  // 3. Extract Supplier Name from header lines
  const headerCandidates = lines.slice(0, 10).filter((l) => {
    const lower = l.toLowerCase();
    const isWatermark = lower.includes('.ai') || lower.includes('generated') || lower.includes('http');
    const isDate = /^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}$/.test(l.replace(/[^\d\/\.-]/g, ''));
    return !lower.includes('invoice') && !lower.includes('tax') && !lower.includes('gstin')
      && !lower.includes('original') && !lower.includes('bill') && !lower.includes('phone')
      && !lower.includes('date') && l.length >= 3 && !isWatermark && !isDate;
  });
  if (headerCandidates.length > 0) {
    const pharmaLine = headerCandidates.find(l => /pharma|medical|distributor|agency|medicos|chemist|drug|enterprises/i.test(l));
    supplier_name = (pharmaLine || headerCandidates[0]).replace(/^[^A-Za-z0-9]+/, '');
  }

  // 3b. Extract Bill Total (if present)
  let total = 0;
  for (const line of lines) {
    if (/TOTAL\s*(?:ITEMS|QTY|COUNT|LINES)/i.test(line)) continue;
    const totalMatch = line.match(/\b(?:grand\s*total|net\s*(?:amount|payable|total)|bill\s*amount|total\s*(?:amount)?)\s*[:\.-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i);
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(/,/g, ''));
      break;
    }
  }

  // 4. Line Items Extraction
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('subtotal') || lower.includes('grand total') || lower.includes('gstin') || lower.includes('bank details') || lower.includes('terms & conditions')) {
      continue;
    }
    // Skip invoice/bill header lines
    if (/\b(?:invoice|bill|vch|memo)\s*(?:no|num|#)/i.test(line) || /^\s*(?:tax\s*invoice|bill\s*of\s*supply|cash\s*memo)\b/i.test(line)) {
      continue;
    }
    if (/^\s*(?:date|dt)[\s:\.-]/i.test(line)) {
      continue;
    }
    // Skip table header lines
    if (/ITEM|PARTICULAR|DESCRIPTION|MEDICINE/i.test(line) && /QTY|RATE|PRICE|AMOUNT/i.test(line)) {
      continue;
    }

    const batchMatch = line.match(/\b(?:b\.?no|batch|bno|b\/n)[\s:\.]*([A-Z0-9\-]+)/i);
    const expMatch = line.match(/\b(?:exp|expiry)[\s:\.]*(\d{1,2}[\/\.-]\d{2,4})/i)
      || line.match(/\b(0[1-9]|1[0-2])[\/\.-](\d{2}|\d{4})\b/);
    const qtyMatch = line.match(/\b(?:qty|qnty)[\s:\.]*(\d+)/i) || line.match(/\b(\d{1,4})\s*(?:nos|pcs|box|pkt|strip)?\b/i);
    const priceMatch = line.match(/\b(?:rate|p\.?rate|mrp|cost|price)[\s:\.]*₹?\s*(\d+(?:\.\d+)?)/i);

    const matchResult = scoreMedicineMatches(line, medicinesList);
    const { topMatch, candidates, isConfident } = matchResult;

    // Check if line looks like an invoice row (either matched medicine, batch, exp, or has multiple numbers)
    const nums = line.match(/\d+(?:\.\d+)?/g) || [];
    const hasRowSignals = topMatch || batchMatch || expMatch || (nums.length >= 2 && /[a-zA-Z]{3,}/.test(line));

    if (hasRowSignals) {
      const batchStr = batchMatch ? batchMatch[1].trim() : '';
      const expStr = expMatch ? normalizeDate(expMatch[1]) : '';

      let quantity = '';
      if (qtyMatch) {
        quantity = String(parseInt(qtyMatch[1], 10));
      }

      let buyPrice = '';
      if (priceMatch) {
        buyPrice = String(parseFloat(priceMatch[1]));
      }

      if (nums.length >= 2 && (!quantity || !buyPrice)) {
        const potentialQty = parseInt(nums[0], 10);
        const potentialPrice = parseFloat(nums[nums.length - 1]);
        if (!quantity && potentialQty > 0 && potentialQty < 10000) quantity = String(potentialQty);
        if (!buyPrice && potentialPrice >= 0) buyPrice = String(potentialPrice);
      }

      if (!buyPrice && isConfident && topMatch?.medicine?.buy_price) {
        buyPrice = String(topMatch.medicine.buy_price);
      }

      // Catalog-Anchored Sanity Check
      if (isConfident && topMatch?.medicine?.buy_price) {
        const catPrice = Number(topMatch.medicine.buy_price);
        const pQty = Number(quantity);
        const pPrice = Number(buyPrice);
        if (pPrice && pQty && catPrice > 0) {
          if (Math.abs((pPrice / pQty) - catPrice) / catPrice < 0.4) {
             buyPrice = String(Number((pPrice / pQty).toFixed(2)));
          }
        }
        if (pQty > 500 && topMatch.name.includes(String(pQty))) {
           quantity = '';
        }
      }

      // Extract item name: use catalog topMatch, or take text from beginning of line
      let itemName = isConfident ? topMatch.name : (topMatch?.name || '');
      if (!itemName) {
        let cleanLine = line.replace(/^\s*\d+[\.\)\s\-]+/, '').trim();
        cleanLine = cleanLine.replace(/\s+(?:b\.?no|batch|bno|b\/n|exp|expiry|qty|qnty|rate|p\.?rate|mrp|cost|price|amt|amount)[\s:\.].*$/i, '').trim();
        const namePartMatch = cleanLine.match(/^([A-Za-z0-9\s\-\/\+\.]{2,40}?)(?=\s+(?:[A-Z0-9]{5,}|0[1-9]\/|\d{1,2}\/\d{2,4}|\d+\.\d+|$))/i);
        if (namePartMatch && namePartMatch[1].trim().length >= 2) {
          itemName = namePartMatch[1].trim();
        } else if (cleanLine.length >= 2 && /[A-Za-z]{2,}/.test(cleanLine)) {
          itemName = cleanLine;
        }
      }

      if (!itemName || itemName.length < 2) continue;
      if (/^(?:total|subtotal|cgst|sgst|igst|tax|round|discount|amount)/i.test(itemName)) continue;

      const issues = [];
      const qNum = Number(quantity);
      if (!quantity || !Number.isInteger(qNum) || qNum < 1 || qNum > 5000) {
        issues.push('quantity out of range (1-5000)');
      }
      const pNum = Number(buyPrice);
      if (!buyPrice || isNaN(pNum) || pNum <= 0 || pNum > 5000) {
        issues.push('rate out of range (0-5000)');
      }
      if (!expStr) {
        issues.push('missing or invalid expiry');
      } else {
        const d = new Date(expStr);
        if (d < new Date()) issues.push('expiry date is in the past');
      }
      if (!isConfident && (!candidates || candidates.length === 0)) {
        issues.push('unmatched medicine');
      }

      const itemStatus = issues.length > 0 ? 'needs_fix' : 'ready';
      const itemAmount = (Number(quantity) || 0) * (Number(buyPrice) || 0);

      parsedItems.push({
        medicine_id: isConfident ? topMatch.id : '',
        name: itemName,
        matchedName: isConfident ? `${topMatch.name} (${topMatch.company || ''})` : itemName,
        candidates: (candidates || []).map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company || '',
          buy_price: c.buy_price,
        })),
        lowConfidence: !isConfident && candidates && candidates.length > 0,
        batch_number: batchStr.toUpperCase() || '',
        expiry_date: expStr || '',
        quantity: quantity || '',
        buy_price: buyPrice || '',
        amount: itemAmount,
        status: itemStatus,
        issues,
        serverStatus: itemStatus,
        serverIssues: issues,
        hasServerIssues: issues.length > 0,
        rawLine: line,
      });
    }
  }

  return {
    supplier_name,
    invoice_number,
    date,
    total,
    items: parsedItems,
  };
}

module.exports = {
  normalizeDate,
  scoreMedicineMatches,
  parseInvoiceText
};
