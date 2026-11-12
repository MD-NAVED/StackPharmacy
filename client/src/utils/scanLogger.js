/**
 * MediStock Scan Debug Logger (Tag: SCAN_DEBUG)
 * Writes structured diagnostics across image compression, Gemini API request,
 * response parsing, and UI states.
 * Persists logs in localStorage and triggers native Android file output via
 * AndroidLogger (JavaScriptInterface to app files dir: files/scan_debug.log).
 */

const LOG_STORAGE_KEY = 'MEDISTOCK_SCAN_DEBUG_LOGS';
const MAX_LOG_SIZE = 100 * 1024; // 100 KB max buffer in localStorage

export function addScanLog(stage, details = {}) {
  const timestamp = new Date().toISOString();
  let detailsStr = '';

  if (typeof details === 'string') {
    detailsStr = details;
  } else if (details && typeof details === 'object') {
    detailsStr = Object.entries(details)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' | ');
  }

  const logLine = `[SCAN_DEBUG] [${timestamp}] Stage: ${stage} | ${detailsStr}`;

  // 1. Console logging
  if (stage === 'FAILURE' || stage === 'EXCEPTION' || stage === 'ERROR') {
    console.error(logLine);
  } else {
    console.log(logLine);
  }

  // 2. Native Android App Files Dir logging (via MainActivity JavascriptInterface)
  try {
    if (typeof window !== 'undefined' && window.AndroidLogger?.writeScanLog) {
      window.AndroidLogger.writeScanLog(logLine);
    }
  } catch (e) {
    console.warn('[SCAN_DEBUG] AndroidLogger bridge unavailable:', e);
  }

  // 3. Persist in localStorage for in-app sharing / inspection
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = window.localStorage.getItem(LOG_STORAGE_KEY) || '';
      const updated = existing ? existing + '\n' + logLine : logLine;
      // Trim if exceeding max buffer
      const trimmed = updated.length > MAX_LOG_SIZE ? updated.slice(updated.length - MAX_LOG_SIZE) : updated;
      window.localStorage.setItem(LOG_STORAGE_KEY, trimmed);
    }
  } catch {
    // Ignore localStorage quota errors
  }

  return logLine;
}

export function getScanLogs() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(LOG_STORAGE_KEY) || '';
    }
  } catch {
    return '';
  }
  return '';
}

export function clearScanLogs() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LOG_STORAGE_KEY);
    }
  } catch {}
}

export async function shareOrDownloadScanLogs() {
  const content = getScanLogs() || `[SCAN_DEBUG] [${new Date().toISOString()}] No scan logs recorded yet.`;
  const filename = `scan_debug_${new Date().toISOString().slice(0, 10)}.log`;

  // 1. Try Web Share API (native share sheet on mobile)
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([content], filename, { type: 'text/plain' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'MediStock Scan Debug Log',
          text: 'MediStock Bill Scanner Debug Log (SCAN_DEBUG)',
        });
        return { success: true, method: 'share' };
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('[SCAN_DEBUG] Web Share failed, falling back to download:', e);
      } else {
        return { success: false, method: 'cancelled' };
      }
    }
  }

  // 2. Fallback to browser blob download
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    return { success: true, method: 'download' };
  } catch (err) {
    console.error('[SCAN_DEBUG] Download failed:', err);
    return { success: false, error: err.message };
  }
}
