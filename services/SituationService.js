const Situation = require("../models/Situation");
const Lot = require("../models/Lot");

class SituationService {
  static computeAgeInWeeks(dateAchat, initialAgeWeeks, dateSituation) {
    const purchaseDate = new Date(`${dateAchat}T00:00:00Z`);
    const situationDate = new Date(`${dateSituation}T00:00:00Z`);

    if (Number.isNaN(purchaseDate.getTime()) || Number.isNaN(situationDate.getTime())) {
      throw new Error("Invalid date value");
    }

    if (situationDate < purchaseDate) {
      throw new Error("Date Situation cannot be before lot purchase date");
    }

    const diffInMs = situationDate.getTime() - purchaseDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const elapsedWeeks = Math.floor(diffInDays / 7);

    return Number(initialAgeWeeks) + elapsedWeeks;
  }

  static async createSituation(
    pool,
    idLot,
    dateSituation,
    nombreAkohoVivant,
    nombreAkohoMort,
    nombreAtody,
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

    const lotResult = await Lot.findById(pool, idLot);
    const lot = lotResult.recordset[0];

    if (!lot) {
      throw new Error("Lot not found");
    }

    if (!lot.dateAchat) {
      throw new Error("Lot purchase date is missing");
    }

    if (lot.age === null || lot.age === undefined || Number(lot.age) < 0) {
      throw new Error("Lot initial age must be 0 or greater");
    }

    const age = SituationService.computeAgeInWeeks(lot.dateAchat, lot.age, dateSituation);

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
