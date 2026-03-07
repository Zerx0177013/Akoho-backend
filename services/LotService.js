// backend/services/LotService.js
const sql = require("mssql");
const Lot = require("../models/Lot");
const Situation = require("../models/Situation");

class LotService {
  static async createLot(pool, idRace, dateAchat, nombreAkoho, age, prixAchat) {
    // Validation
    if (!idRace) throw new Error("Race ID is required");
    if (!dateAchat) throw new Error("Date Achat is required");
    if (!nombreAkoho || Number(nombreAkoho) <= 0)
      throw new Error("Nombre Akoho must be greater than 0");
    if (Number(age) < 0) throw new Error("Age cannot be negative");
    if (prixAchat === null || prixAchat === undefined || Number(prixAchat) <= 0)
      throw new Error("Prix d'achat must be greater than 0");

    // Business logic
    console.log(`Creating new lot for race ${idRace}`);

    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const result = await Lot.createAtLotCreation(
        transaction,
        idRace,
        dateAchat,
        nombreAkoho,
        age,
        prixAchat,
        null,
      );

      const newLot = result.recordset?.[0];
      if (!newLot || !newLot.idLot) {
        throw new Error("Failed to create lot and retrieve idLot");
      }

      await Situation.create(
        transaction,
        newLot.idLot,
        dateAchat,
        nombreAkoho,
        0,
        0,
        age,
      );

      await transaction.commit();
      return result;
    } catch (error) {
      if (transaction._aborted !== true) {
        try {
          await transaction.rollback();
        } catch (_) {
        }
      }
      throw error;
    }
  }

  static async getAllLots(pool) {
    const result = await Lot.findAll(pool);
    return result.recordset;
  }

  static async getLotById(pool, idLot) {
    const result = await Lot.findById(pool, idLot);
    return result.recordset[0];
  }

  static async getLotsByRace(pool, idRace) {
    const result = await Lot.findByRace(pool, idRace);
    return result.recordset;
  }

  static async getDateAchatById(pool, idLot) {
    return Lot.getDateAchatById(pool, idLot);
  }
}

module.exports = LotService;
