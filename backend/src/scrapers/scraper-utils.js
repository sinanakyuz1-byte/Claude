const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function fetchHtml(url, options = {}) {
  const res = await axios.get(url, {
    headers: { ...DEFAULT_HEADERS, ...options.headers },
    timeout: options.timeout || 15000,
    responseType: 'arraybuffer',
  });

  // Handle Turkish encoding (windows-1254 or utf-8)
  let html;
  try {
    const iconv = require('iconv-lite');
    const contentType = res.headers['content-type'] || '';
    const charset = contentType.match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase() || 'utf-8';
    html = iconv.decode(Buffer.from(res.data), charset === 'windows-1254' ? 'win1254' : 'utf8');
  } catch (_) {
    html = Buffer.from(res.data).toString('utf-8');
  }

  return html;
}

async function fetchJson(url, options = {}) {
  const res = await axios.get(url, {
    headers: { ...DEFAULT_HEADERS, ...options.headers },
    timeout: options.timeout || 15000,
    params: options.params,
  });
  return res.data;
}

async function postJson(url, data, options = {}) {
  const res = await axios.post(url, data, {
    headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json', ...options.headers },
    timeout: options.timeout || 15000,
  });
  return res.data;
}

function parseDate(str) {
  if (!str) return null;
  // Turkish date formats: "15.06.2024 08:00", "15/06/2024", "2024-06-15T08:00:00"
  const cleaned = str.trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // dd.mm.yyyy HH:MM or dd/mm/yyyy HH:MM
  const match = cleaned.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (match) {
    const [, day, month, year, hour = '00', min = '00'] = match;
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${min}:00`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  return null;
}

function normalizeText(str) {
  return (str || '').trim().replace(/\s+/g, ' ');
}

/**
 * Generate a stable, deterministic outage ID.
 * Same outage scraped across multiple cycles produces the same ID,
 * preventing duplicate push notifications.
 */
function stableOutageId({ provider, province, districts, startTime }) {
  const raw = [
    provider,
    province,
    (districts || []).slice().sort().join(','),
    startTime || '',
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

function makeOutage({ type, status, provider, province, districts, neighborhoods, startTime, endTime, description }) {
  const parsedStart = parseDate(startTime) || new Date().toISOString();
  return {
    id: stableOutageId({ provider, province, districts, startTime: parsedStart }),
    type,
    status: status || 'planned',
    provider,
    province,
    districts: districts || [],
    neighborhoods: neighborhoods || [],
    startTime: parsedStart,
    endTime: endTime ? parseDate(endTime) : null,
    description: description || null,
    scrapedAt: new Date().toISOString(),
  };
}

module.exports = { fetchHtml, fetchJson, postJson, parseDate, normalizeText, makeOutage, cheerio };
