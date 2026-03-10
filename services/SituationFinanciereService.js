const SituationFinanciere = require("../models/SituationFinanciere");
const Situation = require("../models/Situation");
const SituationService = require("./SituationService");
const LotService = require("./LotService");
const GrossissementService = require("./GrossissementService");
const RaceService = require("./RaceService");
class SituationFinanciereService {
  static toGrossissementByAgeMap(grossissements) {
    const map = new Map();
    for (const g of grossissements || []) {
      map.set(Number(g.age), g);
    }
    return map;
  }

  static getLastGrossissementAtOrBeforeAge(grossissementsByAge, age) {
    for (let currentAge = Number(age); currentAge >= 0; currentAge--) {
      const g = grossissementsByAge.get(currentAge);
      if (g) return g;
    }
    return null;
  }

  static async calculPoidsTotalAkoho(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
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

    if (!grossissementsByAge) {
      const grossissements = await GrossissementService.getGrossissementsByRace(
        pool,
        lotActuel.idRace,
      );
      grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
    }

    // PoidsMoyen = PoidsInitial(S0) + ΣGainHebdomadaire(S1..Sn) + ProrataJours
    const grossissement0 = grossissementsByAge.get(0);
    if (!grossissement0) return 0;

    const poidsInitial = Number(grossissement0.variation) || 0;
    let sommeGainHebdomadaire = 0;
    let prorataJours = 0;

    // Calculate the chicken's actual age (initial age at purchase + elapsed weeks)
    const ageActuelSemaine = Number(lotActuel.age) + Math.floor(diffJours / 7);
    const resteJours = diffJours % 7;

    // ΣGainHebdomadaire : somme des semaines complètes écoulées depuis l'achat
    let semaine = 1;

    while (semaine < ageActuelSemaine) {
      const g = grossissementsByAge.get(semaine);

      if (g) {
        sommeGainHebdomadaire += Number(g.variation) || 0;
      } else {
        break;
      }

      semaine++;
    }

    // ProrataJours : gain proportionnel sur la semaine en cours
    if (resteJours > 0) {
      const g = grossissementsByAge.get(semaine);
      if (g) prorataJours = ((Number(g.variation) || 0) / 7) * resteJours;
    }

    return poidsInitial + sommeGainHebdomadaire + prorataJours;
  }

  static async calculPoidsSakafo(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
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

    const ageActuelSemaine = Number(lotActuel.age) + Math.floor(diffJours / 7);

    const resteJours = diffJours % 7;

    if (!grossissementsByAge) {
      const grossissements = await GrossissementService.getGrossissementsByRace(
        pool,
        lotActuel.idRace,
      );
      grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
    }

    let lastGrossissement = this.getLastGrossissementAtOrBeforeAge(
      grossissementsByAge,
      ageActuelSemaine,
    );
    let semaine = Number(lotActuel.age);

    // Sum only fully completed weeks since purchase (semaine < ageActuelSemaine)
    while (semaine < ageActuelSemaine) {
      const g = grossissementsByAge.get(semaine);

      if (g) {
        lastGrossissement = g;
        totalPoidsSakafo += g.poidsSakafo;
      } else if (lastGrossissement) {
        totalPoidsSakafo += lastGrossissement.poidsSakafo;
      } else {
        break;
      }

      semaine++;
    }

    // Prorata for the current partial week
    if (resteJours > 0) {
      const g = grossissementsByAge.get(semaine);
      const gToUse = g || lastGrossissement;
      if (gToUse) totalPoidsSakafo += (gToUse.poidsSakafo / 7) * resteJours;
    } else if (diffJours === 0) {
      const g = grossissementsByAge.get(Number(lotActuel.age));
      const gToUse = g || lastGrossissement;
      if (gToUse) totalPoidsSakafo += gToUse.poidsSakafo / 7;
    }

    return totalPoidsSakafo;
  }

  /**
   * Same as calculPoidsTotalAkoho but when lot.age === 1,
   * the chicken doesn't grow on the purchase day (starts the day after).
   */
  static async calculPoidsTotalAkohoPostAchat(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
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
    let diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

    // When age at purchase is 1, skip the purchase day
    if (Number(lotActuel.age) === 1) {
      diffJours = Math.max(0, diffJours - 1);
    }

    if (!grossissementsByAge) {
      const grossissements = await GrossissementService.getGrossissementsByRace(
        pool,
        lotActuel.idRace,
      );
      grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
    }

    const grossissement0 = grossissementsByAge.get(0);
    if (!grossissement0) return 0;

    const poidsInitial = Number(grossissement0.variation) || 0;
    let sommeGainHebdomadaire = 0;
    let prorataJours = 0;

    const ageActuelSemaine = Number(lotActuel.age) + Math.floor(diffJours / 7);
    const resteJours = diffJours % 7;

    let semaine = 1;

    while (semaine < ageActuelSemaine) {
      const g = grossissementsByAge.get(semaine);

      if (g) {
        sommeGainHebdomadaire += Number(g.variation) || 0;
      } else {
        break;
      }

      semaine++;
    }

    if (resteJours > 0) {
      const g = grossissementsByAge.get(semaine);
      if (g) prorataJours = ((Number(g.variation) || 0) / 7) * resteJours;
    }

    return poidsInitial + sommeGainHebdomadaire + prorataJours;
  }

  /**
   * Same as calculPoidsSakafo but when lot.age === 1,
   * the chicken doesn't eat on the purchase day (starts the day after).
   */
  static async calculPoidsSakafoPostAchat(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
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
    let diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
    let totalPoidsSakafo = 0;

    // When age at purchase is 1, skip the purchase day
    if (Number(lotActuel.age) === 1) {
      diffJours = Math.max(0, diffJours - 1);
    }

    const ageActuelSemaine = Number(lotActuel.age) + Math.floor(diffJours / 7);
    const resteJours = diffJours % 7;

    if (!grossissementsByAge) {
      const grossissements = await GrossissementService.getGrossissementsByRace(
        pool,
        lotActuel.idRace,
      );
      grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
    }

    let lastGrossissement = this.getLastGrossissementAtOrBeforeAge(
      grossissementsByAge,
      ageActuelSemaine,
    );
    let semaine = Number(lotActuel.age);

    while (semaine < ageActuelSemaine) {
      const g = grossissementsByAge.get(semaine);

      if (g) {
        lastGrossissement = g;
        totalPoidsSakafo += g.poidsSakafo;
      } else if (lastGrossissement) {
        totalPoidsSakafo += lastGrossissement.poidsSakafo;
      } else {
        break;
      }

      semaine++;
    }

    if (resteJours > 0) {
      const g = grossissementsByAge.get(semaine);
      const gToUse = g || lastGrossissement;
      if (gToUse) totalPoidsSakafo += (gToUse.poidsSakafo / 7) * resteJours;
    } else if (diffJours === 0) {
      // age 1 + diffJours forced to 0 → no food on purchase day
      return 0;
    }

    return totalPoidsSakafo;
  }

  static async calculChiffreDaffaire(pool, dateSituation) {
    if (!dateSituation) {
      throw new Error("dateSituation is required");
    }

    const listeLots = await LotService.getAllLots(pool);
    const listeSituationsFinancieres = [];
    const grossissementCacheByRace = new Map();

    for (const lot of listeLots) {
      const race = await RaceService.getRaceById(pool, lot.idRace);
      const situationResult = await Situation.findNearestByLotAndDate(
        pool,
        lot.idLot,
        dateSituation,
      );
      const situation = situationResult.recordset[0];

      if (!race) {
        throw new Error("Race not found for lot id " + lot.idLot);
      }
      if (!situation) {
        continue;
      }

      // Skip lots purchased after the requested date
      if (new Date(lot.dateAchat) > new Date(dateSituation)) {
        continue;
      }

      let grossissementsByAge = grossissementCacheByRace.get(lot.idRace);
      if (!grossissementsByAge) {
        const grossissements =
          await GrossissementService.getGrossissementsByRace(pool, lot.idRace);
        grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
        grossissementCacheByRace.set(lot.idRace, grossissementsByAge);
      }

      const poidsTotalAkoho = await this.calculPoidsTotalAkoho(
        pool,
        lot.idLot,
        dateSituation,
        grossissementsByAge,
      );
      const poidsSakafo = await this.calculPoidsSakafo(
        pool,
        lot.idLot,
        dateSituation,
        grossissementsByAge,
      );
      const dateAchat = new Date(lot.dateAchat);
      const dateSit = new Date(dateSituation);
      const diffJours = Math.floor(
        (dateSit - dateAchat) / (1000 * 60 * 60 * 24),
      );
      const ageEnSemaine = Number(lot.age) + Math.floor(diffJours / 7);

      const nombreAkohoVivant = Number(situation.nombreAkohoVivant || 0);
      const prixVente =
        poidsTotalAkoho * nombreAkohoVivant * race.prixVenteAkoho;
      const coutSakafo = poidsSakafo * nombreAkohoVivant * race.prixAchatSakafo;

      const nbrAtody = situation.nombreAtody;
      const prixVenteAtodyEstimation = nbrAtody * race.prixVenteAtody;
      const poidsMoyenAkoho = nombreAkohoVivant > 0 ? poidsTotalAkoho : 0;

      const benefice =
        prixVente - coutSakafo - lot.prixAchat + prixVenteAtodyEstimation;

        console.log(poidsSakafo);

      const situationLot = new SituationFinanciere(
        lot.idLot,
        coutSakafo,
        prixVente,
        situation.nombreAkohoVivant,
        situation.nombreAkohoMort,
        nbrAtody,
        prixVenteAtodyEstimation,
        benefice,
        poidsMoyenAkoho,
        race.name, // ← race name
        lot.prixAchat, // ← prix achat
        ageEnSemaine, // ← age calculé
      );
      listeSituationsFinancieres.push(situationLot);
    }
    return listeSituationsFinancieres;
  }

  static async sommeBenefice(listeSituationsFinancieres) {
    return listeSituationsFinancieres.reduce(
      (total, situation) => total + Number(situation.benefice || 0),
      0,
    );
  }

  static async sommeCoutSakafo(listeSituationsFinancieres) {
    return listeSituationsFinancieres.reduce(
      (total, situation) => total + Number(situation.prixSakafoTotal || 0),
      0,
    );
  }

  static async sommeChiffreAffaire(listeSituationsFinancieres) {
    return listeSituationsFinancieres.reduce(
      (total, situation) =>
        total +
        Number(situation.prixVenteAkoho || 0) +
        Number(situation.prixAtodyEstimation || 0),
      0,
    );
  }
}

module.exports = SituationFinanciereService;
