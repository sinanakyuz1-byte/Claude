const express = require('express');
const path = require('path');

const router = express.Router();
const locationsData = require('../data/turkey-locations.json');

/**
 * GET /api/provinces
 * Tüm 81 ili döndürür
 */
router.get('/provinces', (req, res) => {
  const provinces = locationsData.provinces.map(({ code, name }) => ({ code, name }));
  res.json(provinces);
});

/**
 * GET /api/districts?province=İstanbul
 * Seçilen ilin ilçelerini döndürür
 */
router.get('/districts', (req, res) => {
  const { province } = req.query;
  if (!province) return res.status(400).json({ error: 'province parametresi gerekli' });

  const prov = locationsData.provinces.find(
    (p) => p.name.toLowerCase() === province.toLowerCase()
  );

  if (!prov) return res.status(404).json({ error: 'İl bulunamadı' });

  res.json(prov.districts);
});

/**
 * GET /api/providers?province=İstanbul
 * Bir ilin servis sağlayıcılarını döndürür
 */
router.get('/providers', (req, res) => {
  const { province } = req.query;
  if (!province) return res.status(400).json({ error: 'province parametresi gerekli' });

  const prov = locationsData.provinces.find(
    (p) => p.name.toLowerCase() === province.toLowerCase()
  );

  if (!prov) return res.status(404).json({ error: 'İl bulunamadı' });

  const result = {
    electricity: prov.edas ? locationsData.edas[prov.edas] : null,
    water: prov.water,
    gas: prov.gas,
  };

  res.json(result);
});

module.exports = router;
