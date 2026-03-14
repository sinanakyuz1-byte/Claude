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
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

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
