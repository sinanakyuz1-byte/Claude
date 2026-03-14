/**
 * İZSU - İzmir Su ve Kanalizasyon İdaresi
 */
const { fetchHtml, fetchJson, normalizeText, makeOutage, cheerio } = require('../scraper-utils');

const PROVIDER = 'İZSU';
const PROVINCE = 'İzmir';

async function scrape() {
  try {
    const data = await fetchJson('https://www.izsu.gov.tr/api/kesinti', {
      headers: { Referer: 'https://www.izsu.gov.tr' },
    });
    if (Array.isArray(data)) {
      return data.map((item) =>
        makeOutage({ type: 'water', status: 'planned', provider: PROVIDER, province: PROVINCE, districts: parseList(item.ilce), neighborhoods: parseList(item.mahalle), startTime: item.baslangic, endTime: item.bitis, description: normalizeText(item.aciklama || '') })
      );
    }
  } catch (_) {}

  try {
    const html = await fetchHtml('https://www.izsu.gov.tr/tr/icerik/ariza-ve-kesinti-bilgileri');
    return parseHtml(html);
  } catch (err) {
    console.error('[İZSU] Scrape failed:', err.message);
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

module.exports = { scrape, name: 'İZSU', province: PROVINCE };
