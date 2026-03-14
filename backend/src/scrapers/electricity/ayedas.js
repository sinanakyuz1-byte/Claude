/**
 * AYEDAŞ - Anadolu Yakası Elektrik Dağıtım A.Ş.
 * İstanbul Anadolu Yakası elektrik kesintileri
 * URL: https://www.ayedas.com.tr/elektrik-kesintileri
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'AYEDAŞ';
const PROVINCE = 'İstanbul';

async function scrape() {
  try {
    return await scrapeApi();
  } catch (err) {
    console.warn('[AYEDAŞ] API failed, falling back to HTML:', err.message);
    try {
      return await scrapeHtml();
    } catch (err2) {
      console.error('[AYEDAŞ] HTML scrape failed:', err2.message);
      return [];
    }
  }
}

async function scrapeApi() {
  const data = await fetchJson('https://www.ayedas.com.tr/api/elektrik-kesintileri', {
    headers: { Referer: 'https://www.ayedas.com.tr/elektrik-kesintileri' },
  });

  if (!Array.isArray(data)) throw new Error('Unexpected API response');

  return data.map((item) =>
    makeOutage({
      type: 'electricity',
      status: item.tip === 'ARIZA' ? 'active' : 'planned',
      provider: PROVIDER,
      province: PROVINCE,
      districts: parseList(item.ilce),
      neighborhoods: parseList(item.mahalle),
      startTime: item.baslangic,
      endTime: item.bitis,
      description: normalizeText(item.aciklama || ''),
    })
  );
}

async function scrapeHtml() {
  const html = await fetchHtml('https://www.ayedas.com.tr/elektrik-kesintileri');
  const $ = cheerio.load(html);
  const outages = [];

  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td').toArray().map((c) => normalizeText($(c).text()));
    if (cells.length < 3) return;

    outages.push(
      makeOutage({
        type: 'electricity',
        status: 'planned',
        provider: PROVIDER,
        province: PROVINCE,
        districts: parseList(cells[0]),
        neighborhoods: parseList(cells[1]),
        startTime: cells[2] || null,
        endTime: cells[3] || null,
        description: cells[4] || null,
      })
    );
  });

  return outages;
}

function parseList(str) {
  if (!str) return [];
  return str.split(/[,;\/\n]/).map((s) => s.trim()).filter(Boolean);
}

module.exports = { scrape, name: 'AYEDAŞ', province: PROVINCE };
