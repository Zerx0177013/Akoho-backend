// backend/controller/RaceController.js
const RaceService = require('../services/RaceService');
const poolPromise = require('../db');

class RaceController {
  // POST /api/races
  static async create(req, res) {
    try {
      const { name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody, sexualiteFemelle, oeufPondueMax, mortaliteAtody, incubation } = req.body;

      if (!name || prixAchatSakafo === undefined || prixVenteAkoho === undefined || prixVenteAtody === undefined || sexualiteFemelle === undefined || oeufPondueMax === undefined || mortaliteAtody === undefined || incubation === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const pool = await poolPromise;
      const result = await RaceService.createRace(
        pool, 
        name, 
        prixAchatSakafo, 
        prixVenteAkoho, 
        prixVenteAtody, 
        sexualiteFemelle, 
        oeufPondueMax, 
        mortaliteAtody, 
        incubation
      );

      res.status(201).json({ message: 'Race created successfully', data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/races
  static async getAll(req, res) {
    try {
      const pool = await poolPromise;
      const races = await RaceService.getAllRaces(pool);
      res.json(races);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/races/:id
  static async getById(req, res) {
    try {
      const pool = await poolPromise;
      const race = await RaceService.getRaceById(pool, req.params.id);

      if (!race) {
        return res.status(404).json({ error: 'Race not found' });
      }

      res.json(race);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RaceController;
