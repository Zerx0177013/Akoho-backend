// backend/services/RaceService.js
const Race = require("../models/Race");

class RaceService {
  static async createRace(
    pool,
    name,
    prixAchatSakafo,
    prixVenteAkoho,
    prixVenteAtody,
  ) {
    // Validation
    if (!name) throw new Error("Name is required");
    if (prixAchatSakafo < 0) throw new Error("Price cannot be negative");

    // Business logic (if needed)
    console.log(`Creating new race: ${name}`);

    // Insert into database using model
    const result = await Race.create(
      pool,
      name,
      prixAchatSakafo,
      prixVenteAkoho,
      prixVenteAtody,
    );

    return result;
  }

  static async getAllRaces(pool) {
    const result = await Race.findAll(pool);
    return result.recordset;
  }

  static async getRaceById(pool, idRace) {
    const result = await Race.findById(pool, idRace);
    return result.recordset[0];
  }
  
}

module.exports = RaceService;
