import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { parseInvoiceText, parseInvoiceViaServer } from './invoiceParser.js';
import { addScanLog } from './scanLogger.js';

export const PINNED_PDFJS_VERSION = '4.10.38';

// Configure Mozilla pdf.js worker with exact pinned version matching client package.json
if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PINNED_PDFJS_VERSION}/build/pdf.worker.min.mjs`;
}

/**
 * Loads a PDF Document from File, Blob, or ArrayBuffer.
 * Handles password-protected PDFs with a friendly Hinglish/English error.
 */
export async function loadPdfDocument(fileOrBuffer) {
  let data;
  if (fileOrBuffer instanceof ArrayBuffer) {
    data = fileOrBuffer;
  } else if (fileOrBuffer?.arrayBuffer) {
    data = await fileOrBuffer.arrayBuffer();
  } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(fileOrBuffer)) {
    data = new Uint8Array(fileOrBuffer);
  } else if (fileOrBuffer instanceof Uint8Array) {
    data = fileOrBuffer;
  } else {
    throw new Error('Invalid PDF source');
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
    data = new Uint8Array(data);
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      data,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PINNED_PDFJS_VERSION}/cmaps/`,
      cMapPacked: true,
    });

    loadingTask.onPassword = () => {
      throw new Error('Ye PDF password-protected hai — unlock karke try karo');
    };

    const pdf = await loadingTask.promise;
    return pdf;
  } catch (err) {
    const msg = String(err?.message || '').toLowerCase();
    if (err.name === 'PasswordException' || msg.includes('password') || msg.includes('encrypted')) {
      throw new Error('Ye PDF password-protected hai — unlock karke try karo');
    }
    if (err.name === 'InvalidPDFException' || msg.includes('invalid pdf')) {
      throw new Error('Invalid PDF file format. Please upload a valid invoice PDF.');
    }
    throw err;
  }
}

/**
 * Extracts lightweight (~120px wide) page thumbnails for live UI progress preview.
 */
export async function extractPdfThumbnails(pdf, maxPages = 10) {
  if (typeof document === 'undefined') return [];
  const count = Math.min(pdf.numPages, maxPages);
  const thumbnails = [];

  for (let i = 1; i <= count; i++) {
    try {
      const page = await pdf.getPage(i);
      const unscaledViewport = page.getViewport({ scale: 1, rotation: page.rotate || 0 });
      const scale = 120 / (unscaledViewport.width || 600);
      const viewport = page.getViewport({ scale, rotation: page.rotate || 0 });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const ctx = canvas.getContext('2d');

      if (ctx) {
        try {
          await page.render({ canvasContext: ctx, viewport }).promise;
        } catch {
          /* fallback if native canvas rendering not fully polyfilled in environment */
        }
        thumbnails.push({
          pageNumber: i,
          dataUrl: canvas.toDataURL('image/jpeg', 0.6),
        });
      }

      if (page.cleanup) page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
    } catch (e) {
      console.warn(`Failed to render thumbnail for page ${i}:`, e.message);
    }
  }

  return thumbnails;
}

/**
 * Sequentially renders each PDF page to canvas and runs Tesseract OCR.
 * Sequential execution & immediate canvas disposal prevents WebAssembly OOM
 * on budget Android phones.
 */
export async function parseInvoicePDF(
  fileOrBuffer,
  medicinesList = [],
  onProgress = () => {},
  options = {}
) {
  onProgress('Reading PDF invoice…', 10, { page: 0, totalPages: 0 });
  const pdf = await loadPdfDocument(fileOrBuffer);

  if (pdf.numPages > 10) {
    throw new Error(`Invoice too long (${pdf.numPages} pages). Maximum 10 pages allowed — please split or contact support.`);
  }

  // Pre-extract lightweight thumbnails for progress display
  let thumbnails = [];
  try {
    thumbnails = await extractPdfThumbnails(pdf, 10);
  } catch {
    /* non-blocking */
  }

  let worker = null;
  const pageTexts = [];

  try {
    onProgress('Initializing OCR engine…', 20, { page: 0, totalPages: pdf.numPages, thumbnails });
    // worker initialized on demand

    // FIX A.4: Process max 3 pages; apply total deadline across all pages
    const maxPages = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= maxPages; i++) {
      if (options.signal?.aborted) {
        throw new Error('PDF scan timed out or aborted');
      }

      const convertPct = Math.round(20 + ((i - 0.7) / maxPages) * 70);
      onProgress(`Converting page ${i} of ${maxPages}…`, convertPct, {
        page: i,
        totalPages: maxPages,
        stage: 'converting',
        thumbnails,
      });

      const page = await pdf.getPage(i);
      const unscaled = page.getViewport({ scale: 1, rotation: page.rotate || 0 });
      // 1.5x - 2.0x scale capped at 1600px width for optimal OCR readability without RAM bloat
      const targetScale = Math.min(2.0, 1600 / (unscaled.width || 600));
      const viewport = page.getViewport({ scale: targetScale, rotation: page.rotate || 0 });

      let canvas = null;
      let pageText = '';

      if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');

        try {
          await page.render({ canvasContext: ctx, viewport }).promise;
        } catch {
          /* fallback if native canvas rendering not fully polyfilled in environment */
        }

        const scanPct = Math.round(20 + ((i - 0.2) / maxPages) * 70);
        onProgress(`🛡️ AI Scan (NVIDIA NIM) page ${i} of ${maxPages}…`, scanPct, {
          page: i,
          totalPages: maxPages,
          stage: 'scanning',
          thumbnails,
        });

        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        try {
          const pageParsed = await parseInvoiceViaServer(base64, medicinesList, options);
          pageTexts.push(pageParsed); // store the parsed result
        } catch (geminiErr) {
          addScanLog('FAILURE', {
            failed_stage: 'PDF_PAGE_AI_SCAN',
            page: i,
            status: geminiErr.status || 'unknown',
            error: geminiErr.message || String(geminiErr),
            raw_error_body: JSON.stringify(geminiErr.data || {})
          });

          if (options.signal?.aborted) {
            throw geminiErr;
          }

          addScanLog('FALLBACK_TESSERACT', {
            reason: geminiErr.message || 'AI failed for PDF page',
            page: i
          });
          console.warn('Gemini failed for PDF page, falling back to Tesseract...', geminiErr);
          onProgress(`⚠️ Cloud scan unavailable; using offline mode page ${i} of ${maxPages}…`, scanPct, {
             page: i, totalPages: maxPages, stage: 'offline_ocr', thumbnails
          });

          try {
            const ocrPromise = (async () => {
              if (!worker) worker = await createWorker('eng');
              const { data } = await worker.recognize(canvas);
              return data?.text || '';
            })();
            const pageTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Tesseract PDF page timeout (8s limit)')), 8000)
            );
            const text = await Promise.race([ocrPromise, pageTimeout]);
            pageTexts.push(text);
          } catch (ocrErr) {
            console.warn('Tesseract failed or timed out for PDF page', i, ocrErr);
            pageTexts.push('');
          }
        }

        // Immediate disposal of page & canvas to free memory on budget phones
        canvas.width = 0;
        canvas.height = 0;
      }

      if (page.cleanup) page.cleanup();
    }

    onProgress('Extracting supplier, batches & line items…', 95, {
      page: maxPages,
      totalPages: maxPages,
      stage: 'parsing',
      thumbnails,
    });

    // Merge logic
    let finalParsed = { supplier_name: '', invoice_number: '', date: '', items: [] };
    let hasGemini = false;
    let geminiEngineName = null;
    let combinedText = '';

    for (const res of pageTexts) {
       if (typeof res === 'string') {
          combinedText += res + '\n--- PAGE BREAK ---\n';
       } else {
          hasGemini = true;
          if (res.engine) geminiEngineName = res.engine;
          if (!finalParsed.supplier_name && res.supplier_name) finalParsed.supplier_name = res.supplier_name;
          if (!finalParsed.invoice_number && res.invoice_number) finalParsed.invoice_number = res.invoice_number;
          if (!finalParsed.date && res.date) finalParsed.date = res.date;
          if (res.items) finalParsed.items.push(...res.items);
       }
    }
    
    if (combinedText.trim()) {
       const textParsed = parseInvoiceText(combinedText, medicinesList);
       if (!finalParsed.supplier_name && textParsed.supplier_name) finalParsed.supplier_name = textParsed.supplier_name;
       if (!finalParsed.invoice_number && textParsed.invoice_number) finalParsed.invoice_number = textParsed.invoice_number;
       if (!finalParsed.date && textParsed.date) finalParsed.date = textParsed.date;
       finalParsed.items.push(...textParsed.items);
    }
    
    finalParsed.engine = hasGemini ? (geminiEngineName || 'gemini:cloud') : 'tesseract';

    onProgress('Complete!', 100, { page: pdf.numPages, totalPages: pdf.numPages, stage: 'done', thumbnails });
    return finalParsed;

  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        /* ignore */
      }
    }
  }
}
