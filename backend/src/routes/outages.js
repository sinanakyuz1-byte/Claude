const express = require('express');
const cache = require('../cache');

const router = express.Router();

/**
 * GET /api/outages
 * Query params: province, district, neighborhood, type (electricity|water|gas)
 */
router.get('/', (req, res) => {
  const { province, district, neighborhood, type } = req.query;

  let outages = cache.get('outages') || [];

  if (type) {
    const types = type.split(',').map((t) => t.trim());
    outages = outages.filter((o) => types.includes(o.type));
  }

  if (province) {
    outages = outages.filter((o) =>
      o.province.toLowerCase() === province.toLowerCase()
    );
  }

  if (district) {
    outages = outages.filter((o) =>
      o.districts.some((d) => d.toLowerCase().includes(district.toLowerCase()))
    );
  }

  if (neighborhood) {
    outages = outages.filter((o) =>
      o.neighborhoods.some((n) => n.toLowerCase().includes(neighborhood.toLowerCase()))
    );
  }

  res.json({
    count: outages.length,
    lastUpdated: cache.get('lastUpdated') || null,
    data: outages,
  });
});

/**
 * GET /api/outages/:id
 */
router.get('/:id', (req, res) => {
  const outages = cache.get('outages') || [];
  const outage = outages.find((o) => o.id === req.params.id);
  if (!outage) return res.status(404).json({ error: 'Bulunamadı' });
  res.json(outage);
});

module.exports = router;
