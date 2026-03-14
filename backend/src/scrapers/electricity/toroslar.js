/**
 * Toroslar EDAŞ - Toroslar Elektrik Dağıtım A.Ş.
 * Adana, Gaziantep, Mersin, Hatay, Kahramanmaraş, Osmaniye, Kilis
 * URL: https://online.toroslaredas.com.tr/elektrik-kesintisi-sorgulama
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'Toroslar EDAŞ';
const PROVINCES = ['Adana', 'Gaziantep', 'Mersin', 'Hatay', 'Kahramanmaraş', 'Osmaniye', 'Kilis'];

async function scrape() {
  const allOutages = [];
  for (const province of PROVINCES) {
    try {
      const outages = await scrapeProvince(province);
      allOutages.push(...outages);
    } catch (err) {
      console.warn(`[Toroslar EDAŞ] Error for ${province}:`, err.message);
    }
  }
  return allOutages;
}

async function scrapeProvince(province) {
  try {
    const data = await fetchJson(
      `https://online.toroslaredas.com.tr/api/kesinti?il=${encodeURIComponent(province)}`,
      { headers: { Referer: 'https://online.toroslaredas.com.tr/elektrik-kesintisi-sorgulama' } }
    );
    if (Array.isArray(data)) {
      return data.map((item) =>
        makeOutage({
          type: 'electricity',
          status: item.kesentiTipi === 'ARIZA' ? 'active' : 'planned',
          provider: PROVIDER,
          province,
          districts: parseList(item.ilce),
          neighborhoods: parseList(item.mahalle),
          startTime: item.baslangicTarihi,
          endTime: item.bitisTarihi,
          description: normalizeText(item.aciklama || ''),
        })
      );
    }
  } catch (_) {}

  const html = await fetchHtml(
    `https://online.toroslaredas.com.tr/elektrik-kesintisi-sorgulama?il=${encodeURIComponent(province)}`
  );
  return parseHtml(html, province);
}

function parseHtml(html, province) {
  const $ = cheerio.load(html);
  const outages = [];

  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td').toArray().map((c) => normalizeText($(c).text()));
    if (cells.length < 2) return;

    outages.push(
      makeOutage({
        type: 'electricity',
        status: 'planned',
        provider: PROVIDER,
        province,
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

module.exports = { scrape, name: 'Toroslar EDAŞ', provinces: PROVINCES };
