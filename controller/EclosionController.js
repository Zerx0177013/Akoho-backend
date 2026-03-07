const poolPromise = require('../db');
const EclosionService = require('../services/EclosionService');

class EclosionController {
  static async create(req, res) {
    try {
      const { idLot, nombreAtodyEclos, dateEclosion } = req.body;

      if (!idLot || nombreAtodyEclos === undefined || !dateEclosion) {
        return res.status(400).json({ error: 'idLot, nombreAtodyEclos and dateEclosion are required' });
      }

      const pool = await poolPromise;
      const result = await EclosionService.processEclosion(
        pool,
        idLot,
        nombreAtodyEclos,
        dateEclosion
      );

      res.status(201).json({ message: 'Eclosion processed successfully', data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = EclosionController;
