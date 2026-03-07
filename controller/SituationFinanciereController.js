const poolPromise = require('../db');
const SituationFinanciereService = require('../services/SituationFinanciereService');

class SituationFinanciereController {
  static async getByDate(req, res) {
    try {
      const { dateSituation } = req.query;

      if (!dateSituation) {
        return res.status(400).json({ error: 'dateSituation query parameter is required' });
      }

      const pool = await poolPromise;
      const result = await SituationFinanciereService.calculChiffreDaffaire(pool, dateSituation);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SituationFinanciereController;
