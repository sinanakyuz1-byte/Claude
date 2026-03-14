/**
 * MEDAŞ - Meram Elektrik Dağıtım A.Ş.
 * Konya, Karaman
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'MEDAŞ';
const PROVINCES = ['Konya', 'Karaman'];

async function scrape() {
  const allOutages = [];
  for (const province of PROVINCES) {
    try {
      const outages = await scrapeProvince(province);
      allOutages.push(...outages);
    } catch (err) {
      console.warn(`[MEDAŞ] Error for ${province}:`, err.message);
    }
  }
  return allOutages;
}

async function scrapeProvince(province) {
  try {
    const data = await fetchJson(`https://www.medas.com.tr/api/kesinti?il=${encodeURIComponent(province)}`, {
      headers: { Referer: 'https://www.medas.com.tr' },
    });
    if (Array.isArray(data)) {
      return data.map((item) =>
        makeOutage({ type: 'electricity', status: 'planned', provider: PROVIDER, province, districts: parseList(item.ilce), neighborhoods: parseList(item.mahalle), startTime: item.baslangic, endTime: item.bitis, description: normalizeText(item.aciklama || '') })
      );
    }
  } catch (_) {}

  const html = await fetchHtml(`https://www.medas.com.tr/elektrik-kesintileri?il=${encodeURIComponent(province)}`);
  return parseHtml(html, province);
}

function parseHtml(html, province) {
  const $ = cheerio.load(html);
  const outages = [];
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td').toArray().map((c) => normalizeText($(c).text()));
    if (cells.length < 2) return;
    outages.push(makeOutage({ type: 'electricity', status: 'planned', provider: PROVIDER, province, districts: parseList(cells[0]), neighborhoods: parseList(cells[1]), startTime: cells[2], endTime: cells[3], description: cells[4] }));
  });
  return outages;
}

function parseList(str) {
  if (!str) return [];
  return str.split(/[,;\/\n]/).map((s) => s.trim()).filter(Boolean);
}

module.exports = { scrape, name: 'MEDAŞ', provinces: PROVINCES };
