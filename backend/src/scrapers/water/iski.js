/**
 * İSKİ - İstanbul Su ve Kanalizasyon İdaresi
 * URL: https://iski.istanbul/ariza-ve-kesinti
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'İSKİ';
const PROVINCE = 'İstanbul';

async function scrape() {
  try {
    // Try İSKİ API
    const data = await fetchJson('https://iski.istanbul/api/kesinti-listesi', {
      headers: { Referer: 'https://iski.istanbul/ariza-ve-kesinti' },
    });
    if (Array.isArray(data)) {
      return data.map((item) =>
        makeOutage({
          type: 'water',
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
  } catch (_) {}

  try {
    const html = await fetchHtml('https://iski.istanbul/ariza-ve-kesinti');
    return parseHtml(html);
  } catch (err) {
    console.error('[İSKİ] Scrape failed:', err.message);
    return [];
  }
}

function parseHtml(html) {
  const $ = cheerio.load(html);
  const outages = [];

  $('table tbody tr, .kesinti-item').each((_, row) => {
    const cells = $(row).find('td, .cell').toArray().map((c) => normalizeText($(c).text()));
    if (cells.length < 2) return;
    outages.push(
      makeOutage({
        type: 'water',
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

module.exports = { scrape, name: 'İSKİ', province: PROVINCE };
