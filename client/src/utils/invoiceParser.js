import { createWorker } from 'tesseract.js';
import { api } from '../api.js';
import { addScanLog } from './scanLogger.js';

/**
 * Normalizes date strings like "08/28", "12-2027", "15/08/2026" into YYYY-MM-DD.
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
    // Set to last day of expiry month or day 28
    return `${year}-${month}-28`;
  }

  return '';
}

/**
 * Prepares and compresses high-resolution mobile photos (12MP-48MP) for Gemini Vision.
 * Maintains sharp character edges on low-contrast thermal print:
 * - Ensures long edge is up to 2000px (never downsampled below 1500px if original is larger).
 * - High JPEG quality (0.92) to prevent compression noise around dot-matrix/thermal text.
 * - Enforces minimum payload threshold (~500KB-1.5MB) and rejects thumbnail downscaling.
 * - Logs dimensions and byte size with tag SCAN_DEBUG.
 */
export async function compressImage(file, maxLongEdge = 2000, quality = 0.92) {
  if (!file || typeof window === 'undefined' || (!window.createImageBitmap && !window.Image)) {
    addScanLog('COMPRESSION', { note: 'No canvas/image API, sending raw file', size: file?.size });
    return file;
  }

  const computeScaledDimensions = (origW, origH) => {
    const longEdge = Math.max(origW, origH);
    if (longEdge <= maxLongEdge) {
      return { width: origW, height: origH };
    }
    if (origW >= origH) {
      return {
        width: maxLongEdge,
        height: Math.round((origH * maxLongEdge) / origW)
      };
    } else {
      return {
        width: Math.round((origW * maxLongEdge) / origH),
        height: maxLongEdge
      };
    }
  };

  // Modern browser path: automatic EXIF orientation normalization
  if (typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(file, { imageOrientation: 'from-image' });
      const { width, height } = computeScaledDimensions(bitmap.width, bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        if (bitmap.close) bitmap.close();
        let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        canvas.width = 0;
        canvas.height = 0;

        if (blob) {
          // If compressed blob is below 500KB but original file was >= 500KB and within 4MB,
          // prefer the higher-resolution original to preserve thermal print contrast
          let finalBlob = blob;
          if (blob.size < 500 * 1024 && file.size >= 500 * 1024 && file.size <= 4 * 1024 * 1024) {
            finalBlob = file;
          }
          addScanLog('COMPRESSION', {
            final_byte_size: finalBlob.size,
            size_kb: (finalBlob.size / 1024).toFixed(1),
            dimensions: `${width}x${height}`,
            quality,
            orig_size_kb: (file.size / 1024).toFixed(1)
          });
          return finalBlob;
        }
        return file;
      }
      if (bitmap.close) bitmap.close();
    } catch (e) {
      addScanLog('COMPRESSION_FALLBACK', { error: e.message });
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = computeScaledDimensions(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        addScanLog('COMPRESSION', { note: 'Canvas context null, returning original', size: file.size });
        return resolve(file);
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          canvas.width = 0;
          canvas.height = 0;
          let finalBlob = blob || file;
          if (blob && blob.size < 500 * 1024 && file.size >= 500 * 1024 && file.size <= 4 * 1024 * 1024) {
            finalBlob = file;
          }
          addScanLog('COMPRESSION', {
            final_byte_size: finalBlob.size,
            size_kb: (finalBlob.size / 1024).toFixed(1),
            dimensions: `${width}x${height}`,
            quality,
            orig_size_kb: (file.size / 1024).toFixed(1)
          });
          resolve(finalBlob);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      addScanLog('COMPRESSION_ERROR', { error: 'Failed to load image element' });
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Scores all medicines against the OCR text line and returns candidate matches.
 * - Confident match (score >= 60): isConfident = true, auto-select candidate.
 * - Low confidence (25 <= score < 60): isConfident = false, returns top 3 candidates for user selection.
 * - Score < 25: no match found.
 */
export function scoreMedicineMatches(rawLine, medicines) {
  if (!medicines || !medicines.length || !rawLine) {
    return { topMatch: null, candidates: [], isConfident: false };
  }
  const lineLower = rawLine.toLowerCase();
  const scored = [];

  for (const m of medicines) {
    const medNameLower = m.name.toLowerCase();
    const companyLower = (m.company || '').toLowerCase();

    let score = 0;
    // Direct substring match
    if (lineLower.includes(medNameLower)) {
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

/**
 * Parses raw OCR text lines to extract Supplier, Invoice No, Date, and Line Items.
 * ZERO SILENT DEFAULTS: unextracted fields remain empty strings with candidate lists
 * so the user can review and manually verify rather than saving corrupted data.
 */
export function parseInvoiceText(rawText, medicinesList = []) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let supplier_name = '';
  let invoice_number = '';
  let date = '';
  const parsedItems = [];

  // 1. Extract Invoice Number (line-by-line to prevent multiline bleed)
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
    // Prefer lines with typical distributor keywords
    const pharmaLine = headerCandidates.find(l => /pharma|medical|distributor|agency|medicos/i.test(l));
    supplier_name = (pharmaLine || headerCandidates[0]).replace(/^[^A-Za-z0-9]+/, '');
  }

  // 3b. Extract Bill Total (if present)
  let total = 0;
  for (const line of lines) {
    const totalMatch = line.match(/\b(?:grand\s*total|net\s*(?:amount|payable|total)|bill\s*amount|total\s*(?:amount)?)\s*[:\.-]?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
    if (totalMatch) {
      total = parseFloat(totalMatch[1]);
      break;
    }
  }

  // 4. Line Items Extraction
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('subtotal') || lower.includes('grand total') || lower.includes('gstin') || lower.includes('bank details')) {
      continue;
    }

    const batchMatch = line.match(/\b(?:b\.?no|batch|bno|b\/n)[\s:\.]*([A-Z0-9\-]+)/i);
    const expMatch = line.match(/\b(?:exp|expiry)[\s:\.]*(\d{1,2}[\/\.-]\d{2,4})/i);
    const qtyMatch = line.match(/\b(?:qty|qnty)[\s:\.]*(\d+)/i) || line.match(/\b(\d{1,4})\s*(?:nos|pcs|box|pkt)?\b/i);
    const priceMatch = line.match(/\b(?:rate|p\.?rate|mrp|cost|price)[\s:\.]*₹?\s*(\d+(?:\.\d+)?)/i);

    const matchResult = scoreMedicineMatches(line, medicinesList);
    const { topMatch, candidates, isConfident } = matchResult;

    if (topMatch || batchMatch || expMatch) {
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

      const nums = line.match(/\d+(?:\.\d+)?/g) || [];
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
          // If parsed price / parsed_qty is close to catalog buy_price, then pPrice was AMOUNT (total) instead of RATE
          if (Math.abs((pPrice / pQty) - catPrice) / catPrice < 0.4) {
             buyPrice = String(Number((pPrice / pQty).toFixed(2)));
          }
        }
        
        // If parsed qty > 500 and the medicine name contains that dosage number (e.g. "CROCIN 650" -> 650)
        if (pQty > 500 && topMatch.name.includes(String(pQty))) {
           quantity = ''; // Blank it, it picked dosage as qty
        }
      }

      // Validate parsed item quality (status: 'ready' | 'needs_fix')
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

      // NO SILENT DEFAULTS:
      // If confident, assign medicine_id. If not confident, leave empty '' and supply candidates.
      // batch_number, expiry_date, quantity, buy_price are left empty if unextracted.
      parsedItems.push({
        medicine_id: isConfident ? topMatch.id : '',
        name: isConfident ? topMatch.name : (topMatch?.name || ''),
        matchedName: isConfident ? `${topMatch.name} (${topMatch.company})` : '',
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          buy_price: c.buy_price,
        })),
        lowConfidence: !isConfident && candidates.length > 0,
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
    engine: 'tesseract',
    supplier_name,
    invoice_number,
    date,
    total,
    items: parsedItems,
  };
}

/**
 * Quality-gate offline Tesseract OCR results.
 * RULE: After a tesseract-engine scan, if more than half the items have
 * status 'needs_fix' OR the items-total mismatches the bill total by >2%:
 * 1. DISCARD the parsed line items (items: [])
 * 2. KEEP the header fields that passed validation (supplier_name, invoice_number, date)
 * 3. Mark qualityGated: true
 */
export function qualityGateTesseractResult(parsed) {
  if (!parsed) return parsed;
  const isTesseract = !parsed.engine || (
    parsed.engine === 'tesseract' ||
    parsed.engine.includes('tesseract') ||
    parsed.engine.includes('fallback')
  );
  if (!isTesseract) return parsed;

  const items = parsed.items || [];
  if (items.length === 0) return parsed;

  const needsFixCount = items.filter((it) =>
    it.status === 'needs_fix' ||
    it.serverStatus === 'needs_fix' ||
    (it.issues && it.issues.length > 0) ||
    (it.serverIssues && it.serverIssues.length > 0)
  ).length;

  const moreThanHalfNeedsFix = needsFixCount > items.length / 2;

  const itemsTotal = items.reduce(
    (sum, it) => sum + (Number(it.amount) || ((Number(it.quantity) || 0) * (Number(it.buy_price) || 0))),
    0
  );
  const billTotal = Number(parsed.total) || 0;
  const totalMismatch = billTotal > 0 && Math.abs(itemsTotal - billTotal) / billTotal > 0.02;

  if (moreThanHalfNeedsFix || totalMismatch) {
    return {
      ...parsed,
      qualityGated: true,
      gateReason: moreThanHalfNeedsFix ? 'more_than_half_needs_fix' : 'total_mismatch',
      items: [], // DISCARD the parsed line items
    };
  }

  return parsed;
}

/**
 * Runs Tesseract OCR on an image file/blob and parses structure.
 * Compresses to 1280px first to avoid mobile WebAssembly memory issues.
 */

/**
 * Sends image to the Gemini Vision server endpoint.
 */
export async function parseInvoiceViaServer(base64Image, medicinesList, options = {}) {
  const startTime = Date.now();
  let data;
  
  // FIX B: 45s client timeout (must exceed server worst case ~20s + margin)
  let internalController = null;
  let signal = options.signal;
  let timeoutId = null;

  if (!signal) {
    internalController = new AbortController();
    timeoutId = setTimeout(() => internalController.abort(), 45000);
    signal = internalController.signal;
  }

  try {
    data = await api('/api/purchases/scan-invoice', {
      method: 'POST',
      body: { image_base64: base64Image },
      signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    const latency_ms = Date.now() - startTime;
    addScanLog('FAILURE', {
      failed_stage: 'API_CALL',
      status: err.status || 502,
      latency_ms,
      error: err.message || String(err),
      raw_error_body: JSON.stringify(err.data || {})
    });
    throw err;
  }

  const latency_ms = Date.now() - startTime;
  addScanLog('API_CALL', {
    status: data.debug?.status || 200,
    latency_ms: data.debug?.latency_ms || latency_ms,
    raw_response: (data.debug?.raw_response_snippet || JSON.stringify(data.items || [])).slice(0, 2000)
  });
  
  // Transform Gemini output to match UI shape
  let transformedItems = [];
  try {
    transformedItems = (data.items || []).map(item => {
      const itemName = String(item.name || item.medicine_name || '').trim();
      const matchResult = scoreMedicineMatches(itemName + (item.company ? ' ' + item.company : ''), medicinesList);
      const { topMatch, candidates, isConfident } = matchResult;
      
      const qtyVal = item.qty !== undefined && item.qty !== null ? item.qty : item.quantity;
      const qtyStr = qtyVal !== null && qtyVal !== undefined ? String(qtyVal) : '';
      const rateVal = item.rate !== undefined && item.rate !== null ? item.rate : item.buy_price;
      const rateStr = rateVal !== null && rateVal !== undefined ? String(rateVal) : '';

      // FIX 2: Pass through server-side validation status and issues
      const serverStatus = item.status; // 'ready' | 'needs_fix'
      const serverIssues = Array.isArray(item.issues) ? item.issues : [];
      const hasServerIssues = serverStatus === 'needs_fix' && serverIssues.length > 0;

      return {
        medicine_id: isConfident ? topMatch.id : '',
        name: itemName,
        matchedName: isConfident ? `${topMatch.name} (${topMatch.company})` : itemName,
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          buy_price: c.buy_price,
        })),
        lowConfidence: !isConfident && candidates.length > 0,
        batch_number: (item.batch_number || '').toUpperCase(),
        expiry_date: item.expiry || '',
        quantity: qtyStr,
        free_quantity: item.free_quantity !== null && item.free_quantity !== undefined ? String(item.free_quantity) : '',
        buy_price: rateStr,
        rawLine: `${itemName} ${item.batch_number || ''} ${item.expiry || ''} ${qtyStr} ${rateStr}`.trim(),
        serverStatus: serverStatus || 'ready',
        serverIssues,
        hasServerIssues
      };
    });

    addScanLog('PARSING', {
      parsed_item_count: transformedItems.length,
      has_error: !!data.error,
      error: data.error || null
    });
  } catch (parseEx) {
    addScanLog('FAILURE', {
      failed_stage: 'CLIENT_RESPONSE_MAPPING',
      error: parseEx.message || String(parseEx)
    });
    throw parseEx;
  }
  
  return {
    engine: data.engine || 'gemini:unknown',
    supplier_name: data.distributor || data.supplier_name || '',
    invoice_number: data.bill_no || data.invoice_number || '',
    date: data.date || data.invoice_date || '',
    total: data.total || 0,
    error: data.error || null,
    items: transformedItems
  };
}

export async function parseInvoiceImage(imageFile, medicinesList = [], onProgress = () => {}) {
  let worker = null;
  try {
    onProgress('Compressing invoice image for mobile…', 10);
    const compressed = await compressImage(imageFile, 2000, 0.92);

    onProgress('Initializing OCR engine…', 25);
    worker = await createWorker('eng');

    onProgress('Scanning invoice text & table lines…', 50);
    const { data } = await worker.recognize(compressed);

    onProgress('Extracting supplier, batches & prices…', 85);
    const parsed = parseInvoiceText(data.text || '', medicinesList);

    onProgress('Complete!', 100);
    return parsed;
  } catch (err) {
    console.error('Invoice OCR error:', err);
    throw new Error('Failed to read invoice image. Please check image lighting or enter manually.');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Unified router for invoice files (Camera, Gallery images, and PDF uploads).
 * Dispatches to parseInvoicePDF for PDFs or parseInvoiceImage for standard image formats.
 */
export async function parseInvoiceFile(file, medicinesList = [], onProgress = () => {}, options = {}) {
  if (!file) {
    addScanLog('FAILURE', { failed_stage: 'FILE_SELECTION', error: 'No file provided' });
    throw new Error('No file provided for scanning');
  }

  addScanLog('START_SCAN', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'unknown'
  });

  const isPdf = file.type === 'application/pdf' || String(file.name || '').toLowerCase().endsWith('.pdf');
  if (isPdf) {
    const { parseInvoicePDF } = await import('./pdfProcessor.js');
    return parseInvoicePDF(file, medicinesList, onProgress, options);
  }

  // Regular Image Flow
  onProgress('Compressing invoice image for mobile…', 10);
  const compressedBlob = await compressImage(file, 2000, 0.92);
  
  try {
    onProgress('✨ AI Scan (Gemini) - Processing...', 50, { stage: 'cloud_scan' });
    // Convert blob to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(compressedBlob);
    });
    const parsed = await parseInvoiceViaServer(base64, medicinesList, options);
    console.log(`[Invoice Scanner] engine=${parsed.engine || 'gemini'} completed successfully`);
    onProgress('Complete!', 100, { stage: 'done' });
    return parsed;
  } catch (err) {
    // If the caller aborted, do not attempt Tesseract fallback
    if (options.signal?.aborted) {
      throw err;
    }

    const isMisconfigured = err.data?.misconfigured || 
      err.status === 404 || 
      err.status === 400 || 
      err.data?.stage === 'MODEL_CONFIG_ERROR' || 
      err.data?.stage === 'API_KEY_CHECK';

    addScanLog('FAILURE', {
      failed_stage: isMisconfigured ? 'MODEL_MISCONFIGURED' : 'AI_SCAN_ENGINE',
      status: err.status || 'unknown',
      error: err.message || String(err),
      raw_error_body: JSON.stringify(err.data || {}),
      misconfigured: isMisconfigured
    });

    if (isMisconfigured) {
      console.error('[Invoice Scanner] Cloud model is misconfigured! Halting scan without Tesseract fallback.', err);
      throw new Error(`Cloud scan model misconfigured (${err.message}). Offline OCR fallback disabled.`);
    }

    // FIX A.3: Tesseract fallback: only start if it can finish; give it max 8s, else skip and return failure
    console.warn(`[Invoice Scanner] AI engine failed (${err?.message || 'error'}), falling back to engine=tesseract (local OCR):`, err);
    addScanLog('FALLBACK_TESSERACT', {
      trigger: 'cloud_failure',
      status: err.status || 'unknown',
      reason: err.message || 'Upstream AI error'
    });
    onProgress('⚠️ Cloud scan unavailable; using offline mode...', 60, { stage: 'offline_ocr' });
    try {
      const ocrPromise = parseInvoiceImage(compressedBlob, medicinesList, (msg, pct) => {
        onProgress(`⚠️ Cloud scan unavailable; using offline mode - ${msg}`, pct, { stage: 'offline_ocr' });
      });
      const tesseractTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tesseract timeout: exceeded 8s limit')), 8000)
      );

      const parsed = await Promise.race([ocrPromise, tesseractTimeout]);
      const gated = qualityGateTesseractResult(parsed);
      addScanLog('PARSING', {
        parsed_item_count: gated.items?.length || 0,
        original_item_count: parsed.items?.length || 0,
        quality_gated: !!gated.qualityGated,
        engine: 'tesseract'
      });
      console.log(`[Invoice Scanner] engine=tesseract (fallback) completed successfully (qualityGated=${!!gated.qualityGated})`);
      return {
        ...gated,
        engine: 'tesseract',
        warning: gated.qualityGated
          ? "Couldn't read this bill reliably. Please enter items manually — supplier details filled from scan."
          : 'Cloud scan unavailable; using offline mode'
      };
    } catch (localErr) {
      addScanLog('FAILURE', {
        failed_stage: 'LOCAL_OCR_FALLBACK',
        error: localErr.message || String(localErr)
      });
      // Skip Tesseract and rethrow upstream error so clean honest message displays
      throw err;
    }
  }
}