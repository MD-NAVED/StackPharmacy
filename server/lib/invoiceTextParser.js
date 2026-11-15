/**
 * Standalone Invoice Text & Table Parsing Utility
 * Extracted and optimized for zero-dependency execution inside serverless containers.
 * Supports both single-line tabular rows and multi-line item blocks (common in Indian thermal bills).
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
  let total = 0;

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
      && !lower.includes('mob:') && !lower.includes('plot ') && !lower.includes('retailer')
      && !lower.includes('date') && l.length >= 3 && !isWatermark && !isDate;
  });
  if (headerCandidates.length > 0) {
    const pharmaLine = headerCandidates.find(l => /pharma|medical|distributor|agency|medicos|chemist|drug|enterprises/i.test(l));
    supplier_name = (pharmaLine || headerCandidates[0]).replace(/^[^A-Za-z0-9]+/, '');
  }

  // 3b. Extract Bill Total (if present)
  for (const line of lines) {
    if (/TOTAL\s*(?:ITEMS|QTY|COUNT|LINES|STRIPS|PIECES)/i.test(line)) continue;
    const totalMatch = line.match(/\b(?:grand\s*total|net\s*(?:amount|payable|total)|bill\s*amount|total\s*(?:amount)?)\s*[:\.-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i);
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(/,/g, ''));
      break;
    }
  }

  // 4. Find the Items Section Boundaries (ignore headers, addresses, retailer info and footers)
  let itemsStartIndex = -1;
  let itemsEndIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (itemsStartIndex === -1) {
      if (/\b(?:SR\.?|S\.?NO|ITEM|PARTICULAR|DESCRIPTION|MEDICINE)\b/i.test(line) && /\b(?:ITEM|DESC|QTY|RATE|PRICE|AMOUNT|BATCH)\b/i.test(line)) {
        itemsStartIndex = i + 1;
      }
    } else {
      // Look for footer end
      if (/\b(?:TOTAL\s*(?:QTY|ITEMS|COUNT|STRIPS)|TAXABLE\s*VALUE|SUBTOTAL|GRAND\s*TOTAL|NET\s*(?:PAYABLE|AMOUNT)|CGST|SGST|IGST)\b/i.test(line)) {
        itemsEndIndex = i;
        break;
      }
    }
  }

  // Fallback boundaries if no explicit table header found
  if (itemsStartIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/\b(?:invoice|bill|vch|memo)\s*(?:no|num|#)/i.test(line)) continue;
      if (/^\s*(?:tax\s*invoice|bill\s*of\s*supply|cash\s*memo)\b/i.test(line)) continue;
      if (/PHARMACEUTICALS|MEDICAL|CHEMIST|DRUG|DISTRIBUTOR/i.test(line)) continue;
      if ((/\b(?:b\.?no|batch)\b/i.test(line) || /\b(?:exp|expiry)\b/i.test(line) || /\b(?:qty|qnty)\b/i.test(line)) && /\b(?:rate|price|mrp|amount)\b/i.test(line)) {
        itemsStartIndex = i;
        break;
      }
      if (/^\s*\d{1,2}\s+[A-Za-z]{3,}/.test(line) && !line.includes('Plot') && !line.includes('Sector') && !line.includes('Mob:') && !line.includes('GSTIN')) {
        itemsStartIndex = i;
        break;
      }
    }
  }
  if (itemsStartIndex === -1) itemsStartIndex = 0;

  const itemLines = lines.slice(itemsStartIndex, itemsEndIndex);

  // Group items into blocks (handles multi-line thermal print AND single-line tabular rows)
  const itemBlocks = [];
  let currentBlock = null;

  for (const line of itemLines) {
    if (/^[-=_\s]+$/.test(line)) continue; // Skip horizontal dividers
    if (/\b(?:TOTAL\s*QTY|TAXABLE\s*VALUE|CGST|SGST|IGST|GRAND\s*TOTAL|ROUND\s*OFF)\b/i.test(line)) break;

    const isAttributeLine = /^\s*(?:QTY|RATE|AMT|AMOUNT|BATCH|B\.?NO|EXP|EXPIRY|MRP)[:\s]/i.test(line);
    const startsWithSNo = /^\s*\d{1,3}\s+[A-Za-z]/.test(line);
    const isSingleLineComplete = /\b(?:QTY|QUANTITY)[\s:\.]*\d+/i.test(line) && /\b(?:RATE|PRICE|MRP)[\s:\.]*[\d\.]+/i.test(line) && /\b(?:BATCH|B\.?NO|EXP|EXPIRY)/i.test(line);

    if (isSingleLineComplete) {
      if (currentBlock) itemBlocks.push(currentBlock);
      currentBlock = [line];
    } else if (startsWithSNo) {
      if (currentBlock) itemBlocks.push(currentBlock);
      currentBlock = [line];
    } else if (isAttributeLine) {
      if (currentBlock) {
        currentBlock.push(line);
      } else {
        currentBlock = [line];
      }
    } else {
      if (currentBlock && currentBlock.length === 1 && !/[:\d]/.test(currentBlock[0]) && !/[:\d]/.test(line)) {
        currentBlock[0] += ' ' + line;
      } else {
        if (currentBlock) itemBlocks.push(currentBlock);
        currentBlock = [line];
      }
    }
  }
  if (currentBlock) itemBlocks.push(currentBlock);

  const parsedItems = [];

  for (const block of itemBlocks) {
    const combinedBlockText = block.join(' ');
    
    // Extract fields from combinedBlockText
    const qtyMatch = combinedBlockText.match(/\b(?:QTY|QNTY)[\s:\.]*(\d+)/i)
      || combinedBlockText.match(/\b(\d{1,4})\s*(?:nos|pcs|box|pkt|strip|strips|tab|tabs)?\b/i);
    const priceMatch = combinedBlockText.match(/\b(?:RATE|P\.?RATE|PRICE|COST)[\s:\.]*₹?\s*(\d+(?:\.\d+)?)/i);
    const amtMatch = combinedBlockText.match(/\b(?:AMT|AMOUNT|TOTAL)[\s:\.]*₹?\s*(\d+(?:\.\d+)?)/i);
    const batchMatch = combinedBlockText.match(/\b(?:B\.?NO|BATCH|BNO|B\/N)[\s:\.]*([A-Z0-9\-]+)/i);
    const expMatch = combinedBlockText.match(/\b(?:EXP|EXPIRY)[\s:\.]*(\d{1,2}[\/\.-]\d{2,4})/i)
      || combinedBlockText.match(/\b(0[1-9]|1[0-2])[\/\.-](\d{2}|\d{4})\b/);

    // Extract item name from block's first line
    let firstLine = block[0];
    if (/\b(?:invoice|bill|vch|memo)\s*(?:no|num|#)/i.test(firstLine) || /^\s*(?:tax\s*invoice|bill\s*of\s*supply|cash\s*memo)\b/i.test(firstLine) || /^\s*(?:date|dt)[\s:\.-]/i.test(firstLine)) {
      continue;
    }
    if (/^\s*(?:plot|sector|road|gstin|mob:|phone|retailer)\b/i.test(firstLine)) {
      continue;
    }

    let itemName = firstLine.replace(/^\s*\d{1,3}[\.\)\s\-]+/, '').trim(); // Remove leading S.No
    // Strip inline metadata keywords
    itemName = itemName.replace(/\s+(?:QTY|RATE|PRICE|AMT|AMOUNT|BATCH|B\.?NO|EXP|EXPIRY)[\s:\.].*$/i, '').trim();

    // Skip orphaned metadata lines
    if (/^\s*(?:QTY|RATE|AMT|AMOUNT|BATCH|B\.?NO|EXP|EXPIRY)[:\s]/i.test(firstLine)) {
      continue;
    }

    if (!itemName || itemName.length < 2) continue;
    if (/^(?:SR|ITEM|PARTICULAR|DESCRIPTION|RETAILER|TOTAL|TAX|GST|DISCOUNT)/i.test(itemName)) continue;
    if (/\b(?:invoice|bill|vch|memo)\s*(?:no|num|#)/i.test(itemName)) continue;

    let qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 0;
    let rate = priceMatch ? parseFloat(priceMatch[1]) : 0;
    let amount = amtMatch ? parseFloat(amtMatch[1]) : (qty * rate);

    if (amount === 0 && qty > 0 && rate > 0) {
      amount = parseFloat((qty * rate).toFixed(2));
    }

    const batchStr = batchMatch ? batchMatch[1].trim() : '';
    const expStr = expMatch ? normalizeDate(expMatch[1]) : '';

    // Match against database medicines catalog if available
    const matchResult = scoreMedicineMatches(itemName, medicinesList);
    const { topMatch, candidates, isConfident } = matchResult;

    const issues = [];
    if (!qty || qty < 1 || qty > 5000) issues.push('quantity out of range (1-5000)');
    if (!rate || rate <= 0 || rate > 5000) issues.push('rate out of range (0-5000)');
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

    parsedItems.push({
      medicine_id: isConfident ? topMatch.id : '',
      name: isConfident ? topMatch.name : itemName,
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
      expiry: expStr || '',
      quantity: qty || '',
      qty: qty || '',
      buy_price: rate || '',
      rate: rate || '',
      amount: amount || (qty * rate),
      status: itemStatus,
      issues,
      serverStatus: itemStatus,
      serverIssues: issues,
      hasServerIssues: issues.length > 0,
      rawLine: combinedBlockText
    });
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
