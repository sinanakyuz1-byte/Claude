/**
 * Uludağ EDAŞ - Bursa, Balıkesir, Bilecik, Yalova
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'Uludağ EDAŞ';
const PROVINCES = ['Bursa', 'Balıkesir', 'Bilecik', 'Yalova'];

async function scrape() {
  const allOutages = [];
  for (const province of PROVINCES) {
    try {
      const outages = await scrapeProvince(province);
      allOutages.push(...outages);
    } catch (err) {
      console.warn(`[Uludağ EDAŞ] Error for ${province}:`, err.message);
    }
  }
  return allOutages;
}

async function scrapeProvince(province) {
  try {
    const data = await fetchJson(
      `https://www.uludagedas.com.tr/api/kesinti?il=${encodeURIComponent(province)}`,
      { headers: { Referer: 'https://www.uludagedas.com.tr' } }
    );
    if (Array.isArray(data)) {
      return data.map((item) =>
        makeOutage({ type: 'electricity', status: 'planned', provider: PROVIDER, province, districts: parseList(item.ilce), neighborhoods: parseList(item.mahalle), startTime: item.baslangic, endTime: item.bitis, description: normalizeText(item.aciklama || '') })
      );
    }
  } catch (_) {}

  const html = await fetchHtml(`https://www.uludagedas.com.tr/elektrik-kesintileri?il=${encodeURIComponent(province)}`);
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

module.exports = { scrape, name: 'Uludağ EDAŞ', provinces: PROVINCES };
