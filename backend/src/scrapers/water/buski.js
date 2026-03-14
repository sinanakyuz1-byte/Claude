/**
 * BUSKİ - Bursa Su ve Kanalizasyon İdaresi
 */
const { fetchHtml, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'BUSKİ';
const PROVINCE = 'Bursa';

async function scrape() {
  try {
    const html = await fetchHtml('https://www.buski.gov.tr/ariza-bilgileri');
    return parseHtml(html);
  } catch (err) {
    console.error('[BUSKİ] Scrape failed:', err.message);
    return [];
  }
}

function parseHtml(html) {
  const $ = cheerio.load(html);
  const outages = [];
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td').toArray().map((c) => normalizeText($(c).text()));
    if (cells.length < 2) return;
    outages.push(makeOutage({ type: 'water', status: 'planned', provider: PROVIDER, province: PROVINCE, districts: parseList(cells[0]), neighborhoods: parseList(cells[1]), startTime: cells[2], endTime: cells[3], description: cells[4] }));
  });
  return outages;
}

function parseList(str) {
  if (!str) return [];
  return str.split(/[,;\/\n]/).map((s) => s.trim()).filter(Boolean);
}

module.exports = { scrape, name: 'BUSKİ', province: PROVINCE };
