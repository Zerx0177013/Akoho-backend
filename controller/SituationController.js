const poolPromise = require('../db');
const SituationService = require('../services/SituationService');

class SituationController {
  // POST /api/situations
  static async create(req, res) {
    try {
      const { idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, mortaliteFemelle } = req.body;

      if (
        !idLot ||
        !dateSituation ||
        nombreAkohoVivant === undefined ||
        nombreAkohoMort === undefined ||
        nombreAtody === undefined
      ) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const pool = await poolPromise;
      const result = await SituationService.createSituation(
        pool,
        idLot,
        dateSituation,
        nombreAkohoVivant,
        nombreAkohoMort,
        nombreAtody,
        mortaliteFemelle || 0
      );

      res.status(201).json({ message: 'Situation created successfully', data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/situations
  static async getAll(req, res) {
    try {
      const pool = await poolPromise;
      const situations = await SituationService.getAllSituations(pool);
      res.json(situations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/situations/lot/:idLot
  static async getByLot(req, res) {
    try {
      const pool = await poolPromise;
      const situations = await SituationService.getSituationsByLot(pool, req.params.idLot);
      res.json(situations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SituationController;
