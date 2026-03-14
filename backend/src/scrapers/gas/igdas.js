/**
 * İGDAŞ - İstanbul Gaz Dağıtım Sanayi ve Ticaret A.Ş.
 * URL: https://www.igdas.com.tr/dogalgaz-kesintileri
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'İGDAŞ';
const PROVINCE = 'İstanbul';

async function scrape() {
  try {
    const data = await fetchJson('https://www.igdas.com.tr/api/kesinti-listesi', {
      headers: { Referer: 'https://www.igdas.com.tr/dogalgaz-kesintileri' },
    });
    if (Array.isArray(data)) {
      return data.map((item) =>
        makeOutage({
          type: 'gas',
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
    const html = await fetchHtml('https://www.igdas.com.tr/dogalgaz-kesintileri');
    return parseHtml(html);
  } catch (err) {
    console.error('[İGDAŞ] Scrape failed:', err.message);
    return [];
  }
}

function parseHtml(html) {
  const $ = cheerio.load(html);
  const outages = [];
  $('table tbody tr, .kesinti-row').each((_, row) => {
    const cells = $(row).find('td').toArray().map((c) => normalizeText($(c).text()));
    if (cells.length < 2) return;
    outages.push(makeOutage({ type: 'gas', status: 'planned', provider: PROVIDER, province: PROVINCE, districts: parseList(cells[0]), neighborhoods: parseList(cells[1]), startTime: cells[2], endTime: cells[3], description: cells[4] }));
  });
  return outages;
}

function parseList(str) {
  if (!str) return [];
  return str.split(/[,;\/\n]/).map((s) => s.trim()).filter(Boolean);
}

module.exports = { scrape, name: 'İGDAŞ', province: PROVINCE };
