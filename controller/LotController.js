// backend/controller/LotController.js
const LotService = require('../services/LotService');
const poolPromise = require('../db');

class LotController {
  // POST /api/lots
  static async create(req, res) {
    try {
      const { idRace, dateAchat, nombreAkoho, age, prixAchat, poidsInitial } = req.body;

      if (!idRace || !dateAchat || !nombreAkoho || age === undefined || !prixAchat || poidsInitial === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const pool = await poolPromise;
      const result = await LotService.createLot(pool, idRace, dateAchat, nombreAkoho, age, prixAchat, poidsInitial);

      res.status(201).json({ message: 'Lot created successfully', data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/lots
  static async getAll(req, res) {
    try {
      const pool = await poolPromise;
      const lots = await LotService.getAllLots(pool);
      res.json(lots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/lots/:id
  static async getById(req, res) {
    try {
      const pool = await poolPromise;
      const lot = await LotService.getLotById(pool, req.params.id);

      if (!lot) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      res.json(lot);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/lots/race/:idRace
  static async getByRace(req, res) {
    try {
      const pool = await poolPromise;
      const lots = await LotService.getLotsByRace(pool, req.params.idRace);
      res.json(lots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = LotController;
