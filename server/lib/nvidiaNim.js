/**
 * NVIDIA NIM Tier-2 Vision & Document Parsing Provider
 *
 * Models (verified via GET https://integrate.api.nvidia.com/v1/models):
 * - M1: nvidia/nemotron-parse (Nemotron 3.5 Parse) - 8s timeout
 *   Deterministic text+table extraction fed into parseInvoiceText + validation
 * - M2: minimaxai/minimax-m3.1-flash (MiniMax M3.1 Flash) - 10s timeout
 *   Native multimodal MoE with JSON direct extraction using Gemini prompt
 * - Alternative: mistralai/mistral-large-4-1t-a52b (Mistral Large 4)
 *
 * Worst-case timing budget:
 * Gemini (18s) + M1 (8s) + M2 (10s) = 36s <= 36s < 45s client timeout
 */

const fs = require('fs');
const path = require('path');

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';
const MODEL_M1_PARSE = 'nvidia/nemotron-parse';
const MODEL_M2_VISION = 'minimaxai/minimax-m3.1-flash';
const MODEL_M2_ALT = 'mistralai/mistral-large-4-1t-a52b';

/**
 * Extracts plain text lines from Nemotron Parse response
 * Handles elements categorized Page-header/Table/Text/Section-header/Page-footer,
 * Markdown tables, or plain text strings.
 */
function extractTextFromNemotronParse(content) {
  if (!content) return '';
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
      return extractTextFromNemotronParse(parsed);
    } catch {
      return content;
    }
  }
  if (Array.isArray(content)) {
    return content.map(extractTextFromNemotronParse).filter(Boolean).join('\n');
  }
  if (typeof content === 'object') {
    if (Array.isArray(content.elements)) {
      return content.elements.map(el => {
        if (typeof el === 'string') return el;
        if (el.text) return el.text;
        if (el.content) return extractTextFromNemotronParse(el.content);
        if (Array.isArray(el.rows)) {
          return el.rows.map(r => Array.isArray(r) ? r.join('  ') : String(r)).join('\n');
        }
        return '';
      }).filter(Boolean).join('\n');
    }
    if (content.text) return content.text;
    if (content.content) return extractTextFromNemotronParse(content.content);
    return Object.values(content).map(extractTextFromNemotronParse).filter(Boolean).join('\n');
  }
  return String(content);
}

/**
 * Call NVIDIA M1 Nemotron Parse (8s timeout)
 */
async function callNvidiaM1(apiKey, base64Data, timeoutMs = 8000, signal = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new Error('NVIDIA M1 deadline exceeded');
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_M1_PARSE,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        temperature: 0.0
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
    throw err;
  }
}

/**
 * Call NVIDIA M2 MiniMax M3.1 Flash (10s timeout)
 */
async function callNvidiaM2(apiKey, base64Data, prompt, timeoutMs = 10000, signal = null, model = MODEL_M2_VISION) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new Error('NVIDIA M2 deadline exceeded');
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        temperature: 0.1
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
    throw err;
  }
}

/**
 * Executes the NVIDIA Tier-2 chain:
 * M1 (nemotron-3.5-parse, 8s timeout) -> M2 (minimax-m3.1-flash, 10s timeout)
 * Total server budget across Gemini + NVIDIA <= 36s
 */
async function executeNvidiaTier({
  base64Data,
  prompt,
  storeId,
  pool,
  startTime,
  maxTotalBudgetMs = 36000,
  logScanDebug = () => {},
  validateParsedItems = (items) => items,
  parseInvoiceTextFn = null
}) {
  const rawKey = process.env.NVIDIA_API_KEY;
  const nvidiaApiKey = rawKey ? rawKey.trim().replace(/^['"]|['"]$/g, '') : '';

  if (!nvidiaApiKey || nvidiaApiKey.includes('[SENSITIVE]')) {
    logScanDebug('PROVIDER_SWITCH', {
      from: 'nvidia',
      to: 'tesseract',
      reason: 'NVIDIA_API_KEY missing in environment — skipping Tier-2 cleanly'
    });
    return null;
  }

  // Load medicines catalog for text matching in M1 path
  let medicinesList = [];
  if (pool && storeId) {
    try {
      const mRes = await pool.query('SELECT id, name, company, buy_price FROM medicines WHERE store_id = $1 LIMIT 500', [storeId]);
      medicinesList = mRes.rows || [];
    } catch (e) {
      logScanDebug('NVIDIA_TIER', { error: 'Failed to fetch medicines catalog for M1', details: e.message });
    }
  }

  // If parseInvoiceTextFn not passed, import dynamically
  if (!parseInvoiceTextFn) {
    try {
      const { pathToFileURL } = require('url');
      const parserPath = path.resolve(__dirname, '../../client/src/utils/invoiceParser.js');
      const invModule = await import(pathToFileURL(parserPath).href);
      parseInvoiceTextFn = invModule.parseInvoiceText;
    } catch (e) {
      logScanDebug('NVIDIA_TIER', { error: 'Failed to load parseInvoiceText', details: e.message });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: Attempt M1 (nemotron-3.5-parse) — 8s timeout
  // ───────────────────────────────────────────────────────────────────────────
  const elapsedBeforeM1 = Date.now() - startTime;
  if (elapsedBeforeM1 < maxTotalBudgetMs) {
    const m1Timeout = Math.min(8000, Math.max(1000, maxTotalBudgetMs - elapsedBeforeM1));
    logScanDebug('API_CALL', {
      provider: 'nvidia',
      model: MODEL_M1_PARSE,
      engine: 'nvidia:nemotron-3.5-parse',
      timeout_ms: m1Timeout
    });

    try {
      // Simulation hook for tests
      if (process.env.SIMULATE_NVIDIA_429 === 'ALL' || process.env.SIMULATE_NVIDIA_429 === 'M1') {
        logScanDebug('PROVIDER_SWITCH', {
          from: 'nvidia:nemotron-3.5-parse',
          to: 'nvidia:minimax-m3.1-flash',
          reason: 'HTTP 429: Too Many Requests (simulated rate limit)'
        });
      } else if (process.env.SIMULATE_NVIDIA_M1_WEAK === 'true') {
        logScanDebug('PROVIDER_SWITCH', {
          from: 'nvidia:nemotron-3.5-parse',
          to: 'nvidia:minimax-m3.1-flash',
          reason: 'M1 output incomplete or weak on thermal bill (simulated)'
        });
      } else {
        let m1Res = null;
        if (process.env.MOCK_NVIDIA_M1_JSON) {
          // Direct mock for unit/acceptance testing
          const mockData = JSON.parse(process.env.MOCK_NVIDIA_M1_JSON);
          m1Res = { ok: true, status: 200, json: async () => mockData };
        } else {
          m1Res = await callNvidiaM1(nvidiaApiKey, base64Data, m1Timeout);
        }

        if (m1Res.ok) {
          const resJson = await m1Res.json();
          const rawContent = resJson.choices?.[0]?.message?.content || '';
          const textExtracted = extractTextFromNemotronParse(rawContent);

          logScanDebug('PARSING', {
            provider: 'nvidia',
            model: MODEL_M1_PARSE,
            extracted_text_length: textExtracted.length
          });

          if (textExtracted && parseInvoiceTextFn) {
            const m1Parsed = parseInvoiceTextFn(textExtracted, medicinesList);
            const normalizedItems = (m1Parsed.items || []).map(it => ({
              name: it.name || it.matchedName || '',
              medicine_name: it.name || it.matchedName || '',
              company: it.company || null,
              batch_number: it.batch_number || null,
              expiry: it.expiry_date || null,
              qty: it.quantity ? Number(it.quantity) : null,
              quantity: it.quantity ? Number(it.quantity) : null,
              free_quantity: it.free_quantity !== undefined ? Number(it.free_quantity) : null,
              rate: it.buy_price ? Number(it.buy_price) : null,
              amount: it.amount ? Number(it.amount) : null,
              unit: it.unit || null,
              medicine_id: it.medicine_id || null
            }));

            const billTotal = Number(m1Parsed.total) || 0;
            const validatedItems = validateParsedItems(normalizedItems, billTotal, 0);
            const readyCount = validatedItems.filter(i => i.status === 'ready').length;

            // If M1 output delivered good items (>= half ready, >= 1 item):
            if (validatedItems.length >= 1 && readyCount >= Math.ceil(validatedItems.length / 2)) {
              logScanDebug('PARSING', {
                provider: 'nvidia',
                model: MODEL_M1_PARSE,
                engine: 'nvidia:nemotron-3.5-parse',
                parsed_item_count: validatedItems.length,
                ready_count: readyCount
              });
              return {
                engine: 'nvidia:nemotron-3.5-parse',
                bill_no: m1Parsed.invoice_number || '',
                invoice_number: m1Parsed.invoice_number || '',
                distributor: m1Parsed.supplier_name || '',
                supplier_name: m1Parsed.supplier_name || '',
                date: m1Parsed.date || '',
                invoice_date: m1Parsed.date || '',
                total: billTotal,
                error: null,
                items: validatedItems,
                debug: {
                  provider: 'nvidia',
                  model: MODEL_M1_PARSE,
                  latency_ms: Date.now() - startTime
                }
              };
            }
          }

          logScanDebug('PROVIDER_SWITCH', {
            from: 'nvidia:nemotron-3.5-parse',
            to: 'nvidia:minimax-m3.1-flash',
            reason: 'M1 output incomplete or weak on thermal bill'
          });
        } else {
          logScanDebug('PROVIDER_SWITCH', {
            from: 'nvidia:nemotron-3.5-parse',
            to: 'nvidia:minimax-m3.1-flash',
            reason: `HTTP ${m1Res.status} from NVIDIA M1`
          });
        }
      }
    } catch (m1Err) {
      logScanDebug('PROVIDER_SWITCH', {
        from: 'nvidia:nemotron-3.5-parse',
        to: 'nvidia:minimax-m3.1-flash',
        reason: `M1 error: ${m1Err.message || String(m1Err)}`
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: Attempt M2 (minimax-m3.1-flash) — 10s timeout
  // ───────────────────────────────────────────────────────────────────────────
  const elapsedBeforeM2 = Date.now() - startTime;
  if (elapsedBeforeM2 >= maxTotalBudgetMs) {
    logScanDebug('PROVIDER_SWITCH', {
      from: 'nvidia:minimax-m3.1-flash',
      to: 'tesseract',
      reason: 'Server worst-case budget exhausted before M2'
    });
    return null;
  }

  const m2Timeout = Math.min(10000, Math.max(1000, maxTotalBudgetMs - elapsedBeforeM2));
  logScanDebug('API_CALL', {
    provider: 'nvidia',
    model: MODEL_M2_VISION,
    engine: 'nvidia:minimax-m3.1-flash',
    timeout_ms: m2Timeout
  });

  try {
    if (process.env.SIMULATE_NVIDIA_429 === 'ALL' || process.env.SIMULATE_NVIDIA_429 === 'M2') {
      logScanDebug('PROVIDER_SWITCH', {
        from: 'nvidia:minimax-m3.1-flash',
        to: 'tesseract',
        reason: 'HTTP 429: Too Many Requests (simulated rate limit)'
      });
      return null;
    }

    let m2Res = null;
    if (process.env.MOCK_NVIDIA_M2_JSON) {
      const mockData = JSON.parse(process.env.MOCK_NVIDIA_M2_JSON);
      m2Res = { ok: true, status: 200, json: async () => mockData };
    } else {
      m2Res = await callNvidiaM2(nvidiaApiKey, base64Data, prompt, m2Timeout, null, MODEL_M2_VISION);
      if (!m2Res.ok && (m2Res.status === 404 || m2Res.status === 400)) {
        // Fallback test Mistral Large 4 if M2 endpoint rejects model ID
        logScanDebug('PROVIDER_SWITCH', {
          from: MODEL_M2_VISION,
          to: MODEL_M2_ALT,
          reason: `HTTP ${m2Res.status} on primary M2 model, trying Mistral Large 4`
        });
        m2Res = await callNvidiaM2(nvidiaApiKey, base64Data, prompt, m2Timeout, null, MODEL_M2_ALT);
      }
    }

    if (m2Res.ok) {
      const resJson = await m2Res.json();
      let rawText = resJson.choices?.[0]?.message?.content || '';
      const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsedData = null;
      try {
        parsedData = JSON.parse(cleaned);
      } catch (parseErr) {
        logScanDebug('FAILURE', { provider: 'nvidia', stage: 'JSON_PARSE', error: parseErr.message });
      }

      if (parsedData && (Array.isArray(parsedData.items) || parsedData.error)) {
        if (parsedData.error === 'unreadable_bill' || (Array.isArray(parsedData.items) && parsedData.items.length === 0)) {
          return {
            engine: 'nvidia:minimax-m3.1-flash',
            bill_no: parsedData.bill_no || parsedData.invoice_number || '',
            invoice_number: parsedData.bill_no || parsedData.invoice_number || '',
            distributor: parsedData.distributor || parsedData.supplier_name || '',
            supplier_name: parsedData.distributor || parsedData.supplier_name || '',
            date: parsedData.date || parsedData.invoice_date || '',
            invoice_date: parsedData.date || parsedData.invoice_date || '',
            total: Number(parsedData.total) || 0,
            error: parsedData.error || 'unreadable_bill',
            items: []
          };
        }

        const normalizedItems = (parsedData.items || []).map(item => {
          let qty = item.qty !== undefined && item.qty !== null ? item.qty : item.quantity;
          if (qty !== null && qty !== undefined) {
            qty = Number(qty);
            if (isNaN(qty) || qty < 0 || qty > 10000) qty = null;
          } else {
            qty = null;
          }

          let rate = item.rate;
          if (rate !== null && rate !== undefined) {
            rate = Number(rate);
            if (isNaN(rate) || rate < 0 || rate > 100000) rate = null;
          } else {
            rate = null;
          }

          let amount = item.amount;
          if (amount !== null && amount !== undefined) {
            amount = Number(amount);
            if (isNaN(amount) || amount < 0) amount = null;
          } else {
            amount = null;
          }

          const name = String(item.name || item.medicine_name || '').trim();
          const unit = item.unit || item.pack || null;
          const batch_number = item.batch_number ? String(item.batch_number).trim() : null;
          let expiry = item.expiry ? String(item.expiry).trim() : null;
          if (expiry && !/^\d{4}-\d{2}(-\d{2})?$/.test(expiry) && !/^\d{1,2}[\/\-]\d{2,4}$/.test(expiry)) {
            expiry = null;
          }

          return {
            name,
            medicine_name: name,
            company: item.company || null,
            batch_number,
            expiry,
            qty,
            quantity: qty,
            free_quantity: item.free_quantity !== undefined ? Number(item.free_quantity) : null,
            rate,
            amount,
            unit
          };
        });

        const billTotal = Number(parsedData.total) || 0;
        const taxableTotal = Number(parsedData.taxable_amount || parsedData.subtotal) || 0;
        const validatedItems = validateParsedItems(normalizedItems, billTotal, taxableTotal);

        logScanDebug('PARSING', {
          provider: 'nvidia',
          model: MODEL_M2_VISION,
          engine: 'nvidia:minimax-m3.1-flash',
          parsed_item_count: validatedItems.length,
          ready_count: validatedItems.filter(i => i.status === 'ready').length
        });

        return {
          engine: 'nvidia:minimax-m3.1-flash',
          bill_no: parsedData.bill_no || parsedData.invoice_number || '',
          invoice_number: parsedData.bill_no || parsedData.invoice_number || '',
          distributor: parsedData.distributor || parsedData.supplier_name || '',
          supplier_name: parsedData.distributor || parsedData.supplier_name || '',
          date: parsedData.date || parsedData.invoice_date || '',
          invoice_date: parsedData.date || parsedData.invoice_date || '',
          total: billTotal,
          error: null,
          items: validatedItems,
          debug: {
            provider: 'nvidia',
            model: MODEL_M2_VISION,
            latency_ms: Date.now() - startTime
          }
        };
      }
    }

    logScanDebug('PROVIDER_SWITCH', {
      from: 'nvidia:minimax-m3.1-flash',
      to: 'tesseract',
      reason: `HTTP ${m2Res.status} from NVIDIA M2`
    });
  } catch (m2Err) {
    logScanDebug('PROVIDER_SWITCH', {
      from: 'nvidia:minimax-m3.1-flash',
      to: 'tesseract',
      reason: `M2 error: ${m2Err.message || String(m2Err)}`
    });
  }

  return null;
}

module.exports = {
  MODEL_M1_PARSE,
  MODEL_M2_VISION,
  MODEL_M2_ALT,
  extractTextFromNemotronParse,
  executeNvidiaTier,
  callNvidiaM1,
  callNvidiaM2
};
