/**
 * BEDAŞ - Boğaziçi Elektrik Dağıtım A.Ş.
 * İstanbul Avrupa Yakası elektrik kesintileri
 * URL: https://www.bedas.com.tr/elektrik-kesintileri
 */
const { fetchHtml, fetchJson, postJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'BEDAŞ';
const PROVINCE = 'İstanbul';

// BEDAŞ provides outage data via an API endpoint used by their website
async function scrape() {
  try {
    // First try the JSON API (reverse-engineered from their web app)
    return await scrapeApi();
  } catch (err) {
    console.warn('[BEDAŞ] API failed, falling back to HTML scrape:', err.message);
    try {
      return await scrapeHtml();
    } catch (err2) {
      console.error('[BEDAŞ] HTML scrape also failed:', err2.message);
      return [];
    }
  }
}

async function scrapeApi() {
  // BEDAŞ outage list API
  const data = await fetchJson('https://www.bedas.com.tr/api/elektrik-kesintileri', {
    headers: { Referer: 'https://www.bedas.com.tr/elektrik-kesintileri' },
  });

  if (!Array.isArray(data)) throw new Error('Unexpected API response format');

  return data.map((item) =>
    makeOutage({
      type: 'electricity',
      status: item.kesinti_turu === 'ARIZA' ? 'active' : 'planned',
      provider: PROVIDER,
      province: PROVINCE,
      districts: parseList(item.ilce || item.ILCE),
      neighborhoods: parseList(item.mahalle || item.MAHALLE),
      startTime: item.baslangic_tarihi || item.BASLANGIC_TARIHI,
      endTime: item.bitis_tarihi || item.BITIS_TARIHI,
      description: normalizeText(item.aciklama || item.ACIKLAMA || ''),
    })
  );
}

async function scrapeHtml() {
  const html = await fetchHtml('https://www.bedas.com.tr/elektrik-kesintileri');
  const $ = cheerio.load(html);
  const outages = [];

  // Try common table/list patterns
  $('table tbody tr, .kesinti-item, .outage-row').each((_, row) => {
    const cells = $(row).find('td, .cell');
    if (cells.length < 2) return;

    const texts = cells.toArray().map((c) => normalizeText($(c).text()));

    outages.push(
      makeOutage({
        type: 'electricity',
        status: 'planned',
        provider: PROVIDER,
        province: PROVINCE,
        districts: parseList(texts[0] || ''),
        neighborhoods: parseList(texts[1] || ''),
        startTime: texts[2] || null,
        endTime: texts[3] || null,
        description: texts[4] || null,
      })
    );
  });

  return outages;
}

function parseList(str) {
  if (!str) return [];
  return str
    .split(/[,;\/\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { scrape, name: 'BEDAŞ', province: PROVINCE };
