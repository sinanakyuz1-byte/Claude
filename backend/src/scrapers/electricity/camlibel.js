/**
 * Çamlıbel EDAŞ - Kayseri, Sivas, Tokat, Yozgat
 */
const { fetchHtml, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'Çamlıbel EDAŞ';
const PROVINCES = ['Kayseri', 'Sivas', 'Tokat', 'Yozgat'];

async function scrape() {
  const allOutages = [];
  for (const province of PROVINCES) {
    try {
      const html = await fetchHtml(`https://www.cedas.com.tr/elektrik-kesintileri?il=${encodeURIComponent(province)}`);
      allOutages.push(...parseHtml(html, province));
    } catch (err) {
      console.warn(`[Çamlıbel EDAŞ] Error for ${province}:`, err.message);
    }
  }
  return allOutages;
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

module.exports = { scrape, name: 'Çamlıbel EDAŞ', provinces: PROVINCES };
