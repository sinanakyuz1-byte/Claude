const cron = require('node-cron');
const cache = require('./cache');
const notifier = require('./notifier');

const electricityScrapers = require('./scrapers/electricity');
const waterScrapers = require('./scrapers/water');
const gasScrapers = require('./scrapers/gas');

const INTERVAL = process.env.SCRAPE_INTERVAL_MINUTES || '15';
const CIRCUIT_BREAK_THRESHOLD = 5;   // consecutive failures before circuit opens
const CIRCUIT_RESET_MS = 2 * 60 * 60 * 1000; // 2 hours

// Per-scraper health state (keyed by scraper.name)
const scraperHealth = new Map();

function getHealth(name) {
  if (!scraperHealth.has(name)) {
    scraperHealth.set(name, {
      consecutiveFails: 0,
      circuitOpen: false,
      circuitOpenedAt: null,
      lastSuccess: null,
      lastRun: null,
      lastError: null,
      totalRuns: 0,
      totalErrors: 0,
    });
  }
  return scraperHealth.get(name);
}

function isCircuitOpen(name) {
  const h = getHealth(name);
  if (!h.circuitOpen) return false;
  // Auto-reset after cooldown
  if (Date.now() - h.circuitOpenedAt >= CIRCUIT_RESET_MS) {
    h.circuitOpen = false;
    h.consecutiveFails = 0;
    h.circuitOpenedAt = null;
    console.log(`[Circuit] ${name} circuit reset after cooldown`);
    return false;
  }
  return true;
}

function recordSuccess(name) {
  const h = getHealth(name);
  h.consecutiveFails = 0;
  h.circuitOpen = false;
  h.lastSuccess = new Date().toISOString();
  h.lastRun = new Date().toISOString();
  h.totalRuns++;
}

function recordFailure(name, err) {
  const h = getHealth(name);
  h.consecutiveFails++;
  h.lastRun = new Date().toISOString();
  h.lastError = err.message || String(err);
  h.totalRuns++;
  h.totalErrors++;

  if (h.consecutiveFails >= CIRCUIT_BREAK_THRESHOLD && !h.circuitOpen) {
    h.circuitOpen = true;
    h.circuitOpenedAt = Date.now();
    console.warn(`[Circuit] ${name} circuit OPENED after ${h.consecutiveFails} consecutive failures`);
  }
}

async function runScraper(scraper) {
  const name = scraper.name || 'Unknown';

  if (isCircuitOpen(name)) {
    const h = getHealth(name);
    const remainingMin = Math.ceil((CIRCUIT_RESET_MS - (Date.now() - h.circuitOpenedAt)) / 60000);
    console.log(`[Circuit] Skipping ${name} (circuit open, resets in ~${remainingMin}m)`);
    return [];
  }

  try {
    const outages = await scraper.scrape();
    recordSuccess(name);
    return Array.isArray(outages) ? outages : [];
  } catch (err) {
    recordFailure(name, err);
    console.error(`[Scheduler] ${name} failed:`, err.message);
    return [];
  }
}

async function runScrapers() {
  console.log(`[Scheduler] Scraping started at ${new Date().toISOString()}`);

  const previous = cache.get('outages') || [];
  const allScrapers = [...electricityScrapers, ...waterScrapers, ...gasScrapers];

  const results = await Promise.all(allScrapers.map((s) => runScraper(s)));

  const current = results.flat();

  cache.set('outages', current);
  cache.set('lastUpdated', new Date().toISOString());
  console.log(`[Scheduler] Cached ${current.length} outages from ${allScrapers.length} scrapers`);

  try {
    await notifier.sendForNewOutages(previous, current);
  } catch (err) {
    console.error('[Scheduler] Notification error:', err.message);
  }
}

function start() {
  const pattern = `*/${INTERVAL} * * * *`;
  console.log(`[Scheduler] Starting with pattern: ${pattern}`);

  runScrapers().catch((err) => console.error('[Scheduler] Initial run error:', err.message));

  cron.schedule(pattern, () => {
    runScrapers().catch((err) => console.error('[Scheduler] Cron error:', err.message));
  });
}

function getScraperStats() {
  const allScrapers = [...electricityScrapers, ...waterScrapers, ...gasScrapers];
  return allScrapers.map((s) => {
    const name = s.name || 'Unknown';
    const h = getHealth(name);
    return {
      name,
      provinces: s.provinces || s.province || null,
      circuitOpen: h.circuitOpen,
      consecutiveFails: h.consecutiveFails,
      lastSuccess: h.lastSuccess,
      lastRun: h.lastRun,
      lastError: h.circuitOpen ? h.lastError : null,
      totalRuns: h.totalRuns,
      totalErrors: h.totalErrors,
    };
  });
}

module.exports = { start, runScrapers, getScraperStats };
