const Lot = require('../models/Lot');
const Situation = require('../models/Situation');

class EclosionService {
  static async processEclosion(pool, idLot, nombreAtodyEclos, dateEclosion) {
    if (!idLot) throw new Error('Lot ID is required');
    if (!dateEclosion) throw new Error('Date eclosion is required');
    if (nombreAtodyEclos === null || nombreAtodyEclos === undefined || Number(nombreAtodyEclos) <= 0) {
      throw new Error('Nombre atody eclos must be greater than 0');
    }

    const sourceLotResult = await Lot.findById(pool, idLot);
    const sourceLot = sourceLotResult.recordset[0];
    if (!sourceLot) {
      throw new Error('Source lot not found');
    }

    const nearestSituationResult = await Situation.findNearestByLotAndDate(pool, idLot, dateEclosion);
    const nearestSituation = nearestSituationResult.recordset[0];
    if (!nearestSituation) {
      throw new Error('No situation found for this lot');
    }

    const eggsToHatch = Number(nombreAtodyEclos);
    const currentEggs = Number(nearestSituation.nombreAtody);

    if (eggsToHatch > currentEggs) {
      throw new Error('Nombre atody eclos cannot be greater than available eggs');
    }

    const newNombreAtody = currentEggs - eggsToHatch;

    await Situation.create(
      pool,
      Number(idLot),
      dateEclosion,
      Number(nearestSituation.nombreAkohoVivant),
      Number(nearestSituation.nombreAkohoMort),
      newNombreAtody,
      Number(nearestSituation.age)
    );

    const newLotResult = await Lot.createAtLotCreation(
      pool,
      Number(sourceLot.idRace),
      dateEclosion,
      eggsToHatch,
      1,
      0
    );

    return {
      sourceLotId: Number(idLot),
      nearestSituationId: Number(nearestSituation.idSituation),
      eggsBefore: currentEggs,
      eggsHatched: eggsToHatch,
      eggsAfter: newNombreAtody,
      newLotId: newLotResult.recordset[0]?.idLot
    };
  }
}

module.exports = EclosionService;
