require('dotenv').config();
const express = require('express');
const cors = require('cors');

const outagesRouter = require('./routes/outages');
const locationsRouter = require('./routes/locations');
const notificationsRouter = require('./routes/notifications');
const scheduler = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  const cache = require('./cache');
  const outages = cache.get('outages') || [];
  const scraperStats = scheduler.getScraperStats();

  const openCircuits = scraperStats.filter((s) => s.circuitOpen);
  const status = openCircuits.length > scraperStats.length / 2 ? 'degraded' : 'ok';

  res.json({
    status,
    time: new Date().toISOString(),
    lastUpdated: cache.get('lastUpdated') || null,
    cachedOutages: outages.length,
    scrapers: {
      total: scraperStats.length,
      healthy: scraperStats.filter((s) => !s.circuitOpen).length,
      circuitOpen: openCircuits.length,
      details: scraperStats,
    },
  });
});

// Routes
app.use('/api/outages', outagesRouter);
app.use('/api', locationsRouter);
app.use('/api/notifications', notificationsRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint bulunamadı' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[App Error]', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

app.listen(PORT, () => {
  console.log(`[App] Server running on http://localhost:${PORT}`);
  scheduler.start();
});

module.exports = app;
