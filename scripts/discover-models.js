const fs = require('fs');
const path = require('path');

function getApiKey() {
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('[SENSITIVE]')) {
    return process.env.GEMINI_API_KEY;
  }
  const envFiles = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env.production')
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const text = fs.readFileSync(f, 'utf8');
      const m = text.match(/^GEMINI_API_KEY=(.+)$/m);
      if (m) {
        const val = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (val && !val.includes('[SENSITIVE]')) {
          return val;
        }
      }
    }
  }
  return null;
}

async function discoverModels() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('FAIL: No valid GEMINI_API_KEY found in .env files');
    process.exit(1);
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const isClassic = apiKey.startsWith('AIzaSy');
    const url = isClassic
      ? `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1beta/models`;
    const headers = !isClassic ? { 'x-goog-api-key': apiKey } : {};

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const latency_ms = Date.now() - startTime;

    if (!res.ok) {
      console.error(`API Error: HTTP ${res.status} ${res.statusText}`);
      const errBody = await res.text().catch(() => '');
      console.error(errBody);
      process.exit(1);
    }

    const data = await res.json();
    const models = data.models || [];

    const flashModels = models
      .filter(m => 
        m.name &&
        m.name.toLowerCase().includes('flash') &&
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent')
      )
      .map(m => ({
        id: m.name.replace(/^models\//, ''),
        displayName: m.displayName,
        supportedGenerationMethods: m.supportedGenerationMethods,
        inputTokenLimit: m.inputTokenLimit,
        outputTokenLimit: m.outputTokenLimit
      }));

    console.log(JSON.stringify({
      status: res.status,
      latency_ms,
      total_models: models.length,
      flash_models_count: flashModels.length,
      flash_models: flashModels,
      selected_model: flashModels.some(m => m.id === 'gemini-3.8-flash')
        ? 'gemini-3.8-flash'
        : (flashModels[0]?.id || null)
    }, null, 2));

  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Request failed:', err.message);
    process.exit(1);
  }
}

discoverModels();
