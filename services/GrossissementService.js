const Grossissement = require('../models/Grossissement');

class GrossissementService {
  static async createGrossissement(pool, idRace, age, variation, poidsSakafo) {
    if (!idRace) throw new Error('Race ID is required');
    if (age === null || age === undefined || Number(age) < 0) {
      throw new Error('Age must be 0 or greater');
    }
    if (variation === null || variation === undefined || Number(variation) < 0) {
      throw new Error('Variation must be 0 or greater');
    }
    if (poidsSakafo === null || poidsSakafo === undefined || Number(poidsSakafo) < 0) {
      throw new Error('Poids Sakafo must be 0 or greater');
    }

    return Grossissement.create(
      pool,
      idRace,
      Number(age),
      Number(variation),
      Number(poidsSakafo)
    );
  }

  static async createBulkGrossissements(pool, idRace, rows) {
    if (!idRace) throw new Error('Race ID is required');
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('At least one row is required');

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.age === null || r.age === undefined || Number(r.age) < 0) {
        throw new Error(`Row ${i + 1}: Age must be 0 or greater`);
      }
      if (r.variation === null || r.variation === undefined || Number(r.variation) < 0) {
        throw new Error(`Row ${i + 1}: Variation must be 0 or greater`);
      }
      if (r.poidsSakafo === null || r.poidsSakafo === undefined || Number(r.poidsSakafo) < 0) {
        throw new Error(`Row ${i + 1}: Poids Sakafo must be 0 or greater`);
      }
    }

    return Grossissement.createBulk(pool, idRace, rows);
  }

  static async getAllGrossissements(pool) {
    const result = await Grossissement.findAll(pool);
    return result.recordset;
  }

  static async getGrossissementsByRace(pool, idRace) {
    const result = await Grossissement.findByRace(pool, idRace);
    return result.recordset;
  }

  static async getGrossissementByAge(pool, age) {
    const result = await Grossissement.findByAge(pool, age);
    return result.recordset;
  }

  static async getGrossissementByRaceAndAge(pool, idRace, age) {
    const result = await Grossissement.findByRaceAndAge(pool, idRace, age);
    return result.recordset;
  }
  
}

module.exports = GrossissementService;
