// backend/controller/GrossissementController.js
const poolPromise = require('../db');
const GrossissementService = require('../services/GrossissementService');

class GrossissementController {
  // POST /api/grossissements
  static async create(req, res) {
    try {
      const { idRace, age, variation, poidsSakafo } = req.body;

      if (!idRace || age === undefined || variation === undefined || poidsSakafo === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const pool = await poolPromise;
      const result = await GrossissementService.createGrossissement(
        pool,
        idRace,
        age,
        variation,
        poidsSakafo
      );

      res.status(201).json({ message: 'Grossissement created successfully', data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/grossissements/bulk
  static async createBulk(req, res) {
    try {
      const { idRace, rows } = req.body;

      if (!idRace || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'idRace and rows array are required' });
      }

      const pool = await poolPromise;
      const result = await GrossissementService.createBulkGrossissements(pool, idRace, rows);

      res.status(201).json({ message: `${rows.length} Grossissement(s) created successfully`, data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/grossissements
  static async getAll(req, res) {
    try {
      const pool = await poolPromise;
      const grossissements = await GrossissementService.getAllGrossissements(pool);
      res.json(grossissements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/grossissements/race/:idRace
  static async getByRace(req, res) {
    try {
      const pool = await poolPromise;
      const grossissements = await GrossissementService.getGrossissementsByRace(pool, req.params.idRace);
      res.json(grossissements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/grossissements/age/:age
  static async getByAge(req, res) {
    try {
      const pool = await poolPromise;
      const grossissements = await GrossissementService.getGrossissementByAge(pool, req.params.age);
      res.json(grossissements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/grossissements/race/:idRace/age/:age
  static async getByRaceAndAge(req, res) {
    try {
      const pool = await poolPromise;
      const grossissement = await GrossissementService.getGrossissementByRaceAndAge(
        pool,
        req.params.idRace,
        req.params.age
      );
      res.json(grossissement);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GrossissementController;
