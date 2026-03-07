const SituationFinanciere = require("../models/SituationFinanciere");
const Situation = require("../models/Situation");
const SituationService = require("./SituationService");
const LotService = require("./LotService");
const GrossissementService = require("./GrossissementService");
const RaceService = require("./RaceService");
class SituationFinanciereService {
  async calculPoidsTotalAkoho(pool, idLot, dateSituation) {
    const situationResult = await Situation.findNearestByLotAndDate(
      pool,
      idLot,
      dateSituation,
    );
    const situation = situationResult.recordset[0];
    if (!situation) {
      throw new Error("No situation found for this lot and date");
    }

    const lotActuel = await LotService.getLotById(pool, idLot);
    const dateAchat = new Date(lotActuel.dateAchat);
    const dateSit = new Date(dateSituation);

    const differenceInMs = dateSit - dateAchat;
    const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

    const grossissement0 =
      await GrossissementService.getGrossissementByRaceAndAge(
        pool,
        lotActuel.idRace,
        0,
      );
    let totalPoidsAkoho = grossissement0.variation;

    const ageActuelSemaine = SituationService.computeAgeInWeeks(
      lotActuel.dateAchat,
      lotActuel.age,
      dateSituation,
    );

    let semaine = 1;
    while (semaine <= ageActuelSemaine) {
      const g = await GrossissementService.getGrossissementByRaceAndAge(
        pool,
        lotActuel.idRace,
        semaine,
      );
      totalPoidsAkoho += g.variation;
      semaine++;
    }
    semaine = ageActuelSemaine + 1;

    // Phase 2
    const diffSemaines = Math.floor(diffJours / 7);
    const resteJours = diffJours % 7;
    semaine = ageActuelSemaine + 1;

    // semaines complètes
    let nbrSemaines = diffSemaines;
    while (nbrSemaines > 0) {
      const g = await GrossissementService.getGrossissementByRaceAndAge(
        pool,
        lotActuel.idRace,
        semaine,
      );
      totalPoidsAkoho += g.variation;
      nbrSemaines--;
      semaine++;
    }

    // jours restants
    if (resteJours > 0) {
      const g = await GrossissementService.getGrossissementByRaceAndAge(
        pool,
        lotActuel.idRace,
        semaine,
      );
      totalPoidsAkoho += (g.variation / 7) * resteJours;
    }
    return totalPoidsAkoho;
  }

  async calculPoidsSakafo(pool, idLot, dateSituation) {
    const situationResult = await Situation.findNearestByLotAndDate(
      pool,
      idLot,
      dateSituation,
    );
    const situation = situationResult.recordset[0];
    if (!situation) {
      throw new Error("No situation found for this lot and date");
    }

    const lotActuel = await LotService.getLotById(pool, idLot);
    const dateAchat = new Date(lotActuel.dateAchat);
    const dateSit = new Date(dateSituation);

    const differenceInMs = dateSit - dateAchat;
    const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
    let totalPoidsSakafo = 0;

    const ageActuelSemaine = SituationService.computeAgeInWeeks(
        lotActuel.dateAchat,
        lotActuel.age,
        dateSituation
    ); 

    const diffSemaines = Math.floor(diffJours / 7);
    const resteJours = diffJours % 7;
    let semaine = ageActuelSemaine + 1;

    let nbrSemaines = diffSemaines;
    while (nbrSemaines > 0) {
      const g = await GrossissementService.getGrossissementByRaceAndAge(
        pool,
        lotActuel.idRace,
        semaine,
      );
      totalPoidsSakafo += g.poidsSakafo;
      nbrSemaines--;
      semaine++;
    }

    if (resteJours > 0) {
      const g = await GrossissementService.getGrossissementByRaceAndAge(
        pool,
        lotActuel.idRace,
        semaine,
      );
      totalPoidsSakafo += (g.poidsSakafo / 7) * resteJours;
    }

    return totalPoidsSakafo;
  }

  async calculChiffreDaffaire(pool, dateSituation) {
    const listeLotsResult = await LotService.getAllLots(pool);
    const listeLots = listeLotsResult.recordset;
    const listeSituationsFinancieres = [];

    for (const lot of listeLots) {
      const raceResult = await RaceService.getRaceById(pool, lot.idRace);
      const race = raceResult.recordset[0];
      const situationResult = await Situation.findNearestByLotAndDate(
        pool,
        idLot,
        dateSituation,
      );
      const situation = situationResult.recordset[0];

      if (!race) {
        throw new Error("Race not found for lot id " + lot.idLot);
      }
      const poidsTotalAkoho = await this.calculPoidsTotalAkoho(
        pool,
        lot.idLot,
        dateSituation,
      );
      const poidsSakafo = await this.calculPoidsSakafo(
        pool,
        lot.idLot,
        dateSituation,
      );
      const prixVente = poidsTotalAkoho * race.prixVenteAkoho;
      const coutSakafo = poidsSakafo * race.prixAchatSakafo;

      const nbrAtody = situation.nombreAtody;
      const prixVenteAtodyEstimation = nbrAtody * race.prixVenteAtody;
      const poidsMoyenAkoho = poidsTotalAkoho / situation.nombreAkohoVivant;

      const benefice =
        prixVente - coutSakafo - lot.prixAchat + prixVenteAtodyEstimation;

      const situationLot = SituationFinanciere(
        pool,
        lot.idLot,
        dateSituation,
        prixVente,
        coutSakafo,
        prixVenteAtodyEstimation,
        benefice,
        poidsMoyenAkoho,
      );
      listeSituationsFinancieres.push(situationLot);
    }
    return listeSituationsFinancieres;
  }
}
