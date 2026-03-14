/**
 * BAŞKENTGAZ - Ankara ve çevre iller doğalgaz dağıtımı
 * URL: https://www.baskentgaz.com.tr/dogalgaz-kesintileri
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'BAŞKENTGAZ';
const PROVINCES = ['Ankara', 'Konya', 'Kayseri', 'Afyonkarahisar', 'Eskişehir', 'Bolu', 'Çankırı', 'Kırşehir', 'Nevşehir', 'Niğde', 'Aksaray', 'Kırıkkale', 'Yozgat'];

async function scrape() {
  const allOutages = [];
  for (const province of PROVINCES) {
    try {
      const data = await fetchJson(
        `https://www.baskentgaz.com.tr/api/kesinti?il=${encodeURIComponent(province)}`,
        { headers: { Referer: 'https://www.baskentgaz.com.tr/dogalgaz-kesintileri' } }
      );
      if (Array.isArray(data)) {
        allOutages.push(...data.map((item) =>
          makeOutage({ type: 'gas', status: 'planned', provider: PROVIDER, province, districts: parseList(item.ilce), neighborhoods: parseList(item.mahalle), startTime: item.baslangic, endTime: item.bitis, description: normalizeText(item.aciklama || '') })
        ));
        continue;
      }
    } catch (_) {}

    try {
      const html = await fetchHtml(`https://www.baskentgaz.com.tr/dogalgaz-kesintileri?il=${encodeURIComponent(province)}`);
      const $ = cheerio.load(html);
      $('table tbody tr').each((_, row) => {
        const cells = $(row).find('td').toArray().map((c) => normalizeText($(c).text()));
        if (cells.length < 2) return;
        allOutages.push(makeOutage({ type: 'gas', status: 'planned', provider: PROVIDER, province, districts: parseList(cells[0]), neighborhoods: parseList(cells[1]), startTime: cells[2], endTime: cells[3], description: cells[4] }));
      });
    } catch (err) {
      console.warn(`[BAŞKENTGAZ] Error for ${province}:`, err.message);
    }
  }
  return allOutages;
}

function parseList(str) {
  if (!str) return [];
  return str.split(/[,;\/\n]/).map((s) => s.trim()).filter(Boolean);
}

module.exports = { scrape, name: 'BAŞKENTGAZ', provinces: PROVINCES };
