const cron = require('node-cron');
const cache = require('./cache');
const notifier = require('./notifier');

const electricityScrapers = require('./scrapers/electricity');
const waterScrapers = require('./scrapers/water');
const gasScrapers = require('./scrapers/gas');

const INTERVAL = process.env.SCRAPE_INTERVAL_MINUTES || '15';

async function runScrapers() {
  console.log(`[Scheduler] Scraping started at ${new Date().toISOString()}`);

  const previous = cache.get('outages') || [];

  const results = await Promise.allSettled([
    ...electricityScrapers.map((s) => s.scrape()),
    ...waterScrapers.map((s) => s.scrape()),
    ...gasScrapers.map((s) => s.scrape()),
  ]);

  const current = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      current.push(...result.value);
    } else if (result.status === 'rejected') {
      console.error('[Scheduler] Scraper error:', result.reason?.message || result.reason);
    }
  }

  cache.set('outages', current);
  console.log(`[Scheduler] Cached ${current.length} outages`);

  try {
    await notifier.sendForNewOutages(previous, current);
  } catch (err) {
    console.error('[Scheduler] Notification error:', err.message);
  }
}

function start() {
  const pattern = `*/${INTERVAL} * * * *`;
  console.log(`[Scheduler] Starting with pattern: ${pattern}`);

  // Run immediately on startup
  runScrapers().catch((err) => console.error('[Scheduler] Initial run error:', err.message));

  cron.schedule(pattern, () => {
    runScrapers().catch((err) => console.error('[Scheduler] Cron error:', err.message));
  });
}

module.exports = { start, runScrapers };
