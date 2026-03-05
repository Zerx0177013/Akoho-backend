// backend/routes/raceRoutes.js
const express = require('express');
const router = express.Router();
const RaceService = require('../services/RaceService');
const poolPromise = require('../db');

router.post('/', async (req, res) => {
  try {
    // Angular sent form data in req.body
    const { name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody } = req.body;

    // Validate
    if (!name || !prixAchatSakafo || !prixVenteAkoho || !prixVenteAtody) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get database connection
    const pool = await poolPromise;

    // Call service to handle business logic
    const result = await RaceService.createRace(pool, name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody);

    // Send response back to Angular
    res.status(201).json({ 
      message: 'Race created successfully', 
      data: result 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;