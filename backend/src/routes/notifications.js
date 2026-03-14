const express = require('express');
const { addSubscription, removeSubscription } = require('../notifier');

const router = express.Router();

/**
 * POST /api/notifications/subscribe
 * Body: { expoPushToken, province, district, neighborhood?, types[] }
 */
router.post('/subscribe', (req, res) => {
  const { expoPushToken, province, district, neighborhood, types } = req.body;

  if (!expoPushToken || !province || !district || !Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ error: 'expoPushToken, province, district ve types gerekli' });
  }

  addSubscription({ expoPushToken, province, district, neighborhood: neighborhood || null, types });
  res.json({ success: true });
});

/**
 * DELETE /api/notifications/unsubscribe
 * Body: { expoPushToken }
 */
router.delete('/unsubscribe', (req, res) => {
  const { expoPushToken } = req.body;
  if (!expoPushToken) return res.status(400).json({ error: 'expoPushToken gerekli' });

  removeSubscription(expoPushToken);
  res.json({ success: true });
});

module.exports = router;
