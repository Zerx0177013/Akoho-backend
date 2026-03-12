const sql = require("mssql");
const Lot = require("../models/Lot");
const Situation = require("../models/Situation");
const Evenement = require("../models/Evenement");
const LotFille = require("../models/LotFille");
const RaceService = require("./RaceService");

class EclosionService {
  static async processEclosion(pool, idLot, nombreAtodyEclos, dateEclosion) {
    if (!idLot) throw new Error("Lot ID is required");
    if (!dateEclosion) throw new Error("Date eclosion is required");
    if (
      nombreAtodyEclos === null ||
      nombreAtodyEclos === undefined ||
      Number(nombreAtodyEclos) <= 0
    ) {
      throw new Error("Nombre atody eclos must be greater than 0");
    }

    const sourceLotResult = await Lot.findById(pool, idLot);
    const sourceLot = sourceLotResult.recordset[0];
    if (!sourceLot) {
      throw new Error("Source lot not found");
    }

    const nearestSituationResult = await Situation.findMostRecentByLotBeforeDate(
      pool,
      idLot,
      dateEclosion,
    );
    const nearestSituation = nearestSituationResult.recordset[0];
    if (!nearestSituation) {
      throw new Error("No situation found for this lot");
    }

    const eggsToHatch = Number(nombreAtodyEclos);
    const currentEggs = Number(nearestSituation.nombreAtody);

    if (eggsToHatch > currentEggs) {
      throw new Error(
        "Nombre atody eclos cannot be greater than available eggs",
      );
    }

    const newNombreAtody = currentEggs - eggsToHatch;

    await Situation.create(
      pool,
      Number(idLot),
      dateEclosion,
      Number(nearestSituation.nombreAkohoVivant),
      Number(nearestSituation.nombreAkohoMort),
      newNombreAtody,
      Number(nearestSituation.age),
    );

    const newLotResult = await Lot.createAtLotCreation(
      pool,
      Number(sourceLot.idRace),
      dateEclosion,
      eggsToHatch,
      1,
      0,
      Number(idLot),
      0,
    );

    await Situation.create(
      pool,
      newLotResult.recordset[0].idLot,
      dateEclosion,
      eggsToHatch,
      0,
      0,
      1,
    );

    return {
      sourceLotId: Number(idLot),
      nearestSituationId: Number(nearestSituation.idSituation),
      eggsBefore: currentEggs,
      eggsHatched: eggsToHatch,
      eggsAfter: newNombreAtody,
      newLotId: newLotResult.recordset[0]?.idLot,
    };
  }

  /**
   * newProcessEclosion(pool, idLot)
   *
   * 1. Get the date of the most recent AJOUT_ATODY event from the evenement table
   * 2. Get the incubation days from the race
   * 3. dateEclosion = dateAjoutAtody + incubation days
   * 4. Create a situation with atody removed on dateEclosion
   * 5. Get the sexualiteFemelle percentage from race
   * 6. Split hatched eggs by sex
   * 7. Create a new child lot on dateEclosion
   * 8. Create a lotFille record with female/male counts
   * 9. Add an eclosion event to the evenement table
   */
  static async newProcessEclosion(pool, idLot) {
    if (!idLot) throw new Error("Lot ID is required");

    // Get the source lot
    const sourceLotResult = await Lot.findById(pool, idLot);
    const sourceLot = sourceLotResult.recordset[0];
    if (!sourceLot) {
      throw new Error("Source lot not found");
    }

    // 1. Get the most recent AJOUT_ATODY event date from evenement table
    const atodyEventResult = await Evenement.findMostRecentAjoutAtodyByLot(
      pool,
      idLot,
    );
    const atodyEvent = atodyEventResult.recordset[0];
    if (!atodyEvent) {
      throw new Error(
        "No AJOUT_ATODY event found for this lot. Cannot determine incubation start date.",
      );
    }

    const dateAjoutAtody = new Date(atodyEvent.dateEvenement);
    dateAjoutAtody.setHours(0, 0, 0, 0);

    // 2. Get incubation days from the race
    const race = await RaceService.getRaceById(pool, sourceLot.idRace);
    if (!race) {
      throw new Error("Race not found for lot id " + idLot);
    }

    const incubationDays = Number(race.incubation);
    if (!incubationDays || incubationDays <= 0) {
      throw new Error("Invalid incubation days for race: " + race.name);
    }

    // 3. dateEclosion = dateAjoutAtody + incubation days
    const dateEclosion = new Date(dateAjoutAtody);
    dateEclosion.setDate(dateEclosion.getDate() + incubationDays);

    // Get the most recent situation on or before the eclosion date
    const situationResult = await Situation.findMostRecentByLotBeforeDate(
      pool,
      idLot,
      dateEclosion,
    );
    let nearestSituation = situationResult.recordset[0];

    // Fallback to most recent situation overall if none before date
    if (!nearestSituation) {
      const fallbackResult = await Situation.findMostRecentSituationByLot(
        pool,
        idLot,
      );
      nearestSituation = fallbackResult.recordset[0];
    }

    if (!nearestSituation) {
      throw new Error("No situation found for this lot");
    }

    const nombreAtodyToHatch = Number(atodyEvent.quantite);
    const currentEggs = Number(nearestSituation.nombreAtody);

    if (nombreAtodyToHatch <= 0) {
      throw new Error("No eggs to hatch from the atody event");
    }

    if (nombreAtodyToHatch > currentEggs) {
      throw new Error(
        `Not enough eggs: trying to hatch ${nombreAtodyToHatch} but only ${currentEggs} available`,
      );
    }

    // Use a transaction for atomicity
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // 4. Create situation with atody subtracted on dateEclosion
      const newNombreAtody = currentEggs - nombreAtodyToHatch;
      const dateEclosionStr = dateEclosion.toISOString().split("T")[0];

      await Situation.create(
        transaction,
        Number(idLot),
        dateEclosionStr,
        Number(nearestSituation.nombreAkohoVivant),
        Number(nearestSituation.nombreAkohoMort),
        newNombreAtody,
        Number(nearestSituation.age),
      );

      // 5. Get the sexualiteFemelle percentage
      const percentFemelle = Number(race.sexualiteFemelle) || 0;

      // 6. Distribute by sex
      const nombreFemelle = Math.round(
        (nombreAtodyToHatch * percentFemelle) / 100,
      );
      const nombreMale = nombreAtodyToHatch - nombreFemelle;

      // 7. Create a new child lot on dateEclosion with nbrAtody as nombreInitial
      const newLotResult = await Lot.createAtLotCreation(
        transaction,
        Number(sourceLot.idRace),
        dateEclosionStr,
        nombreAtodyToHatch,
        0, // age = 0 (newborn)
        0, // prixAchat = 0 (hatched, not bought)
        Number(idLot), // idLotParent
        0, // poidsInitial
      );

      const newLotId = newLotResult.recordset[0]?.idLot;
      if (!newLotId) {
        throw new Error("Failed to create new lot");
      }

      // Create initial situation for the new lot
      await Situation.create(
        transaction,
        newLotId,
        dateEclosionStr,
        nombreAtodyToHatch,
        0,
        0,
        0,
      );

      // 8. Create lotFille record with female/male counts
      await LotFille.create(
        transaction,
        newLotId,
        nombreFemelle,
        nombreMale,
      );

      // 9. Add eclosion event to the evenement table
      await Evenement.createEclosionEvent(
        transaction,
        Number(idLot),
        dateEclosionStr,
        nombreAtodyToHatch,
      );

      await transaction.commit();

      return {
        sourceLotId: Number(idLot),
        dateAjoutAtody: dateAjoutAtody.toISOString().split("T")[0],
        incubationDays,
        dateEclosion: dateEclosionStr,
        eggsHatched: nombreAtodyToHatch,
        eggsBefore: currentEggs,
        eggsAfter: newNombreAtody,
        nombreFemelle,
        nombreMale,
        percentFemelle,
        newLotId,
      };
    } catch (error) {
      if (transaction._aborted !== true) {
        try {
          await transaction.rollback();
        } catch (_) {}
      }
      throw error;
    }
  }
}

module.exports = EclosionService;
