// backend/controller/GrossissementController.js
const poolPromise = require('../db');

class GrossissementController {
  // GET /api/grossissements
  static async getAll(req, res) {
    try {
      res.json({ message: 'Grossissement routes - not implemented yet' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GrossissementController;
