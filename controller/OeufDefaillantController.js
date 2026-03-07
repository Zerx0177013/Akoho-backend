const poolPromise = require('../db');
const OeufDefaillantService = require('../services/OeufDefaillantService');

class OeufDefaillantController {
  static async processOeufDefaillant(req, res) {
    try {
      const { idLot, nombreOeufDefaillant, dateOeufDefaillant } = req.body;

      if (!idLot) {
        return res.status(400).json({ error: 'Lot ID is required' });
      }
      if (!nombreOeufDefaillant) {
        return res.status(400).json({ error: 'Nombre oeuf defaillant is required' });
      }
      if (!dateOeufDefaillant) {
        return res.status(400).json({ error: 'Date oeuf defaillant is required' });
      }

      const pool = await poolPromise;
      const result = await OeufDefaillantService.processOeufDefaillant(pool, idLot, nombreOeufDefaillant, dateOeufDefaillant);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = OeufDefaillantController;
