const Lot = require("../models/Lot");
const Situation = require("../models/Situation");
const Evenement = require("../models/Evenement");
class OeufDefaillantService {
  static async processOeufDefaillant(
    pool,
    idLot,
    nombreOeufDefaillant,
    dateOeufDefaillant,
  ) {
    if (!idLot) throw new Error("Lot ID is required");
    if (!dateOeufDefaillant)
      throw new Error("Date oeuf defaillant is required");
    if (
      nombreOeufDefaillant === null ||
      nombreOeufDefaillant === undefined ||
      Number(nombreOeufDefaillant) <= 0
    ) {
      throw new Error("Nombre oeuf defaillant must be greater than 0");
    }

    const lotResult = await Lot.findById(pool, idLot);
    const lot = lotResult.recordset[0];
    if (!lot) {
      throw new Error("Lot not found");
    }

    const nearestSituationResult = await Situation.findMostRecentByLotBeforeDate(
      pool,
      idLot,
      dateOeufDefaillant,
    );
    const nearestSituation = nearestSituationResult.recordset[0];
    if (!nearestSituation) {
      throw new Error("No situation found for this lot");
    }

    const eggsToRemove = Number(nombreOeufDefaillant);
    const currentEggs = Number(nearestSituation.nombreAtody);

    if (eggsToRemove > currentEggs) {
      throw new Error(
        "Nombre oeuf defaillant cannot be greater than available eggs",
      );
    }

    const newNombreAtody = currentEggs - eggsToRemove;

    await Evenement.createAtodyThrownEvent(
      pool,
      idLot,
      dateOeufDefaillant,
      eggsToRemove,
    );

    await Situation.create(
      pool,
      Number(idLot),
      dateOeufDefaillant,
      Number(nearestSituation.nombreAkohoVivant),
      Number(nearestSituation.nombreAkohoMort),
      newNombreAtody,
      Number(nearestSituation.age),
      Number(nearestSituation.nombreAtodyTotalPossible || 0),
      Number(nearestSituation.nombreAkohoLahy || 0),
      Number(nearestSituation.nombreAkohoVavy || 0)
    );

    return {
      lotId: Number(idLot),
      situationId: Number(nearestSituation.idSituation),
      eggsBefore: currentEggs,
      eggsRemoved: eggsToRemove,
      eggsAfter: newNombreAtody,
    };
  }
}

module.exports = OeufDefaillantService;
