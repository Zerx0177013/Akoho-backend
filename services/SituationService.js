const Situation = require("../models/Situation");

class SituationService {
  static async createSituation(
    pool,
    idLot,
    dateSituation,
    nombreAkohoVivant,
    nombreAkohoMort,
    nombreAtody,
    age,
  ) {
    if (!idLot) throw new Error("Lot ID is required");
    if (!dateSituation) throw new Error("Date Situation is required");
    if (
      nombreAkohoVivant === null ||
      nombreAkohoVivant === undefined ||
      Number(nombreAkohoVivant) < 0
    ) {
      throw new Error("Nombre Akoho Vivant must be 0 or greater");
    }
    if (
      nombreAkohoMort === null ||
      nombreAkohoMort === undefined ||
      Number(nombreAkohoMort) < 0
    ) {
      throw new Error("Nombre Akoho Mort must be 0 or greater");
    }
    if (
      nombreAtody === null ||
      nombreAtody === undefined ||
      Number(nombreAtody) < 0
    ) {
      throw new Error("Nombre Atody must be 0 or greater");
    }
    if (age === null || age === undefined || Number(age) < 0) {
      throw new Error("Age must be 0 or greater");
    }

    // return Situation.create(
    //   pool,
    //   idLot,
    //   dateSituation,
    //   Number(nombreAkohoVivant),
    //   Number(nombreAkohoMort),
    //   Number(nombreAtody),
    //   Number(age)
    // );
    return Situation.addQuantityToMostRecentSituation(
      pool,
      idLot,
      dateSituation,
      Number(nombreAkohoVivant),
      Number(nombreAkohoMort),
      Number(nombreAtody),
      Number(age),
    );
  }

  static async getAllSituations(pool) {
    const result = await Situation.findAll(pool);
    return result.recordset;
  }

  static async getSituationsByLot(pool, idLot) {
    const result = await Situation.findByLot(pool, idLot);
    return result.recordset;
  }
}

module.exports = SituationService;
