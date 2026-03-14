/**
 * Başkent EDAŞ - Başkent Elektrik Dağıtım A.Ş.
 * Ankara ve çevre iller (06, 14, 18, 26, 40, 41, 50, 51, 68, 71, 78)
 * URL: https://online.baskentedas.com.tr/elektrik-kesintisi-sorgulama
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'Başkent EDAŞ';
const PROVINCES = ['Ankara', 'Bolu', 'Çankırı', 'Eskişehir', 'Kırşehir', 'Kocaeli', 'Nevşehir', 'Niğde', 'Aksaray', 'Kırıkkale', 'Karabük'];

async function scrape() {
  const allOutages = [];
  for (const province of PROVINCES) {
    try {
      const outages = await scrapeProvince(province);
      allOutages.push(...outages);
    } catch (err) {
      console.warn(`[Başkent EDAŞ] Error for ${province}:`, err.message);
    }
  }
  return allOutages;
}

async function scrapeProvince(province) {
  // Try JSON API first
  try {
    const data = await fetchJson(
      `https://online.baskentedas.com.tr/api/kesinti-listesi?il=${encodeURIComponent(province)}`,
      { headers: { Referer: 'https://online.baskentedas.com.tr/elektrik-kesintisi-sorgulama' } }
    );
    if (Array.isArray(data)) {
      return data.map((item) =>
        makeOutage({
          type: 'electricity',
          status: 'planned',
          provider: PROVIDER,
          province,
          districts: parseList(item.ilce || item.ILCE),
          neighborhoods: parseList(item.mahalle || item.MAHALLE),
          startTime: item.baslangicTarihi || item.BASLANGIC,
          endTime: item.bitisTarihi || item.BITIS,
          description: normalizeText(item.aciklama || ''),
        })
      );
    }
  } catch (_) {}

  // HTML fallback
  const html = await fetchHtml(
    `https://online.baskentedas.com.tr/elektrik-kesintisi-sorgulama?il=${encodeURIComponent(province)}`
  );
  return parseHtml(html, province);
}

function parseHtml(html, province) {
  const $ = cheerio.load(html);
  const outages = [];

  $('table tbody tr, .kesinti-row').each((_, row) => {
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

module.exports = { scrape, name: 'Başkent EDAŞ', provinces: PROVINCES };
