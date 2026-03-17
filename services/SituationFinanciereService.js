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
    const lotActuel = await LotService.getLotById(pool, idLot);
    const dateAchat = new Date(lotActuel.dateAchat);
    const dateSit = new Date(dateSituation);

    dateAchat.setHours(0, 0, 0, 0);
    dateSit.setHours(0, 0, 0, 0);

    const differenceInMs = dateSit - dateAchat;
    const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffJours < 1) return 0;

    if (!grossissementsByAge) {
      const grossissements = await GrossissementService.getGrossissementsByRace(
        pool,
        lotActuel.idRace,
      );
      grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
    }

    const grossissement0 = grossissementsByAge.get(0);
    if (!grossissement0) return 0;

    const isFromEclosion =
      lotActuel.idLotParent !== null && lotActuel.idLotParent !== undefined;
    const poidsInitial = isFromEclosion
      ? Number(grossissement0.variation) || 0
      : Number(lotActuel.poidsInitial) || Number(grossissement0.variation) || 0;

    let sommeGainHebdomadaire = 0;
    let prorataJours = 0;

    const ageLot = Number(lotActuel.age);
    const scheduleAgeBase = ageLot + 1;
    const ageActuelSemaine = scheduleAgeBase + Math.floor((diffJours - 1) / 7);
    const resteJours = ((diffJours - 1) % 7) + 1;

    let semaine = scheduleAgeBase;
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

  static _cumulativePoidsSakafo(
    lotAge,
    dateAchat,
    targetDate,
    grossissementsByAge,
  ) {
    const dAchat = new Date(dateAchat);
    const dTarget = new Date(targetDate);

    dAchat.setHours(0, 0, 0, 0);
    dTarget.setHours(0, 0, 0, 0);

    const differenceInMs = dTarget - dAchat;
    const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffJours < 1) return 0;

    let totalPoidsSakafo = 0;
    const age = Number(lotAge);
    const scheduleAgeBase = age + 1;

    const ageActuelSemaine = scheduleAgeBase + Math.floor((diffJours - 1) / 7);
    const resteJours = ((diffJours - 1) % 7) + 1;

    let semaine = scheduleAgeBase;
    let lastGrossissement = this.getLastGrossissementAtOrBeforeAge(
      grossissementsByAge,
      ageActuelSemaine,
    );

    while (semaine < ageActuelSemaine) {
      const g = grossissementsByAge.get(semaine);
      if (g) {
        lastGrossissement = g;
        totalPoidsSakafo += g.poidsSakafo;
      } else if (lastGrossissement) {
        totalPoidsSakafo += lastGrossissement.poidsSakafo;
      }
      semaine++;
    }

    if (resteJours > 0) {
      const g = grossissementsByAge.get(semaine);
      const gToUse = g || lastGrossissement;
      if (gToUse) totalPoidsSakafo += (gToUse.poidsSakafo / 7) * resteJours;
    }

    return totalPoidsSakafo;
  }

  static async calculPoidsSakafo(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
    const situationResult = await Situation.findMostRecentByLotBeforeDate(
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

    const ageLot = Number(lotActuel.age);
    const scheduleAgeBase = ageLot + 1;
    const ageActuelSemaine = scheduleAgeBase + Math.floor(diffJours / 7);

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
    let semaine = scheduleAgeBase;

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
      const g = grossissementsByAge.get(scheduleAgeBase);
      const gToUse = g || lastGrossissement;
      if (gToUse) totalPoidsSakafo += gToUse.poidsSakafo / 7;
    }

    return totalPoidsSakafo;
  }

  // static async calculPoidsSakafoWeighted(
  //   pool,
  //   idLot,
  //   dateSituation,
  //   grossissementsByAge = null,
  // ) {
  //   const lotActuel = await LotService.getLotById(pool, idLot);
  //   const dateAchat = new Date(lotActuel.dateAchat);
  //   const dateSit = new Date(dateSituation);

  //   dateAchat.setHours(0, 0, 0, 0);
  //   dateSit.setHours(0, 0, 0, 0);

  //   if (dateSit < dateAchat) return 0;

  //   if (!grossissementsByAge) {
  //     const grossissements = await GrossissementService.getGrossissementsByRace(
  //       pool,
  //       lotActuel.idRace,
  //     );
  //     grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
  //   }

  //   const allSituationsResult = await Situation.findByLotBeforeDate(
  //     pool,
  //     idLot,
  //     dateSituation,
  //   );
  //   const situations = allSituationsResult.recordset;

  //   if (!situations || situations.length === 0) return 0;

  //   let totalWeightedPoidsSakafo = 0;

  //   for (let i = 0; i < situations.length; i++) {
  //     const currentSituation = situations[i];
  //     const segmentStart = new Date(currentSituation.dateSituation);
  //     segmentStart.setHours(0, 0, 0, 0);

  //     let segmentEnd;
  //     if (i + 1 < situations.length) {
  //       segmentEnd = new Date(situations[i + 1].dateSituation);
  //     } else {
  //       segmentEnd = dateSit;
  //     }
  //     segmentEnd.setHours(0, 0, 0, 0);

  //     if (segmentStart > segmentEnd) continue;

  //     const cumulativeAtEnd = this._cumulativePoidsSakafo(
  //       lotActuel.age,
  //       dateAchat,
  //       segmentEnd,
  //       grossissementsByAge,
  //     );

  //     let segmentPoidsSakafo;

  //     if (segmentStart.getTime() === dateAchat.getTime()) {
  //       segmentPoidsSakafo = cumulativeAtEnd;
  //     } else {
  //       const cumulativeAtStart = this._cumulativePoidsSakafo(
  //         lotActuel.age,
  //         dateAchat,
  //         segmentStart,
  //         grossissementsByAge,
  //       );
  //       segmentPoidsSakafo = cumulativeAtEnd - cumulativeAtStart;
  //     }

  //     const nombreVivant = Number(currentSituation.nombreAkohoVivant || 0);
  //     totalWeightedPoidsSakafo += segmentPoidsSakafo * nombreVivant;
  //   }

  //   return totalWeightedPoidsSakafo;
  // }

static async calculPoidsSakafoWeighted(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
    const lotActuel = await LotService.getLotById(pool, idLot);
    const dateAchat = new Date(lotActuel.dateAchat);
    const dateSit = new Date(dateSituation);

    dateAchat.setHours(0, 0, 0, 0);
    dateSit.setHours(0, 0, 0, 0);

    if (dateSit < dateAchat) return 0;

    if (!grossissementsByAge) {
      const grossissements = await GrossissementService.getGrossissementsByRace(
        pool,
        lotActuel.idRace,
      );
      grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
    }

    const allSituationsResult = await Situation.findByLotBeforeDate(
      pool,
      idLot,
      dateSituation,
    );
    const situations = allSituationsResult.recordset;

    if (!situations || situations.length === 0) return 0;

    let totalWeightedPoidsSakafo = 0;

    for (let i = 0; i < situations.length; i++) {
      const currentSituation = situations[i];
      const segmentStart = new Date(currentSituation.dateSituation);
      segmentStart.setHours(0, 0, 0, 0);

      let segmentEnd = (i + 1 < situations.length) 
        ? new Date(situations[i + 1].dateSituation) 
        : dateSit;
      segmentEnd.setHours(0, 0, 0, 0);

      if (segmentStart > segmentEnd) continue;

      // --- NOUVELLE LOGIQUE : SOMME JOUR PAR JOUR DANS LE SEGMENT ---
      let segmentPoidsSakafo = 0;
      let d = new Date(segmentStart);

      // On boucle sur chaque jour du segment
      // on s'arrête AVANT segmentEnd pour ne pas compter le jour de transition deux fois
      while (d < segmentEnd) {
        const diffMs = d - dateAchat;
        const jourDeVie = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // Jour 0, Jour 1, etc.
        
        // Calcul de la ration pour ce jour précis (Jour 0 = ration de la 1ère semaine)
        const ageReelSemaine = Number(lotActuel.age) + 1 + Math.floor(jourDeVie / 7);
        const g = this.getLastGrossissementAtOrBeforeAge(grossissementsByAge, ageReelSemaine);
        
        if (g) {
          segmentPoidsSakafo += (g.poidsSakafo / 7);
        }
        
        d.setDate(d.getDate() + 1);
      }

      // Cas particulier : si c'est le dernier jour (dateSit), on ajoute la ration du dernier jour
      if (segmentEnd.getTime() === dateSit.getTime() && i === situations.length - 1) {
          const diffMs = dateSit - dateAchat;
          const jourDeVie = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const ageReelSemaine = Number(lotActuel.age) + 1 + Math.floor(jourDeVie / 7);
          const g = this.getLastGrossissementAtOrBeforeAge(grossissementsByAge, ageReelSemaine);
          if (g) segmentPoidsSakafo += (g.poidsSakafo / 7);
      }

      const nombreVivant = Number(currentSituation.nombreAkohoVivant || 0);
      totalWeightedPoidsSakafo += segmentPoidsSakafo * nombreVivant;
    }

    return totalWeightedPoidsSakafo;
  }

  static async calculPoidsSakafoWeightedPostAchat(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
    const lotActuel = await LotService.getLotById(pool, idLot);
    const dateAchat = new Date(lotActuel.dateAchat);
    const dateSit = new Date(dateSituation);

    if (dateSit < dateAchat) return 0;

    const effectiveDateAchat =
      Number(lotActuel.age) === 1
        ? new Date(dateAchat.getTime() + 24 * 60 * 60 * 1000)
        : dateAchat;

    if (dateSit < effectiveDateAchat) return 0;

    if (!grossissementsByAge) {
      const grossissements = await GrossissementService.getGrossissementsByRace(
        pool,
        lotActuel.idRace,
      );
      grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
    }

    const allSituationsResult = await Situation.findByLotBeforeDate(
      pool,
      idLot,
      dateSituation,
    );
    const situations = allSituationsResult.recordset;

    if (!situations || situations.length === 0) return 0;

    let totalWeightedPoidsSakafo = 0;

    for (let i = 0; i < situations.length; i++) {
      const currentSituation = situations[i];
      let segmentStart = new Date(currentSituation.dateSituation);

      if (segmentStart < effectiveDateAchat) {
        segmentStart = effectiveDateAchat;
      }

      let segmentEnd;
      if (i + 1 < situations.length) {
        segmentEnd = new Date(situations[i + 1].dateSituation);
      } else {
        segmentEnd = dateSit;
      }

      if (segmentEnd < effectiveDateAchat) continue;

      if (segmentStart >= segmentEnd) continue;

      const cumulativeAtStart = this._cumulativePoidsSakafo(
        lotActuel.age,
        effectiveDateAchat,
        segmentStart,
        grossissementsByAge,
      );
      const cumulativeAtEnd = this._cumulativePoidsSakafo(
        lotActuel.age,
        effectiveDateAchat,
        segmentEnd,
        grossissementsByAge,
      );
      const segmentPoidsSakafo = cumulativeAtEnd - cumulativeAtStart;

      const nombreVivant = Number(currentSituation.nombreAkohoVivant || 0);
      totalWeightedPoidsSakafo += segmentPoidsSakafo * nombreVivant;
    }

    return totalWeightedPoidsSakafo;
  }

  static async calculPoidsTotalAkohoPostAchat(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
    const situationResult = await Situation.findMostRecentByLotBeforeDate(
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

    const isFromEclosion =
      lotActuel.idLotParent !== null && lotActuel.idLotParent !== undefined;
    const poidsInitial = isFromEclosion
      ? Number(grossissement0.variation) || 0
      : Number(lotActuel.poidsInitial) || Number(grossissement0.variation) || 0;
    let sommeGainHebdomadaire = 0;
    let prorataJours = 0;

    const ageLot = Number(lotActuel.age);
    const scheduleAgeBase = ageLot + 1;
    const ageActuelSemaine = scheduleAgeBase + Math.floor(diffJours / 7);
    const resteJours = diffJours % 7;

    let semaine = scheduleAgeBase;
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

  static async calculPoidsSakafoPostAchat(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
    const situationResult = await Situation.findMostRecentByLotBeforeDate(
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

    if (Number(lotActuel.age) === 1) {
      diffJours = Math.max(0, diffJours - 1);
    }

    const ageLot = Number(lotActuel.age);
    const scheduleAgeBase = ageLot + 1;
    const ageActuelSemaine = scheduleAgeBase + Math.floor(diffJours / 7);
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
    let semaine = scheduleAgeBase;

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
      if (Number(lotActuel.age) === 1) return 0;
      const g = grossissementsByAge.get(scheduleAgeBase);
      const gToUse = g || lastGrossissement;
      if (gToUse) totalPoidsSakafo += gToUse.poidsSakafo / 7;
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
      const situationResult = await Situation.findMostRecentByLotBeforeDate(
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

      const poidsSakafoWeighted = await this.calculPoidsSakafoWeighted(
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
      const coutSakafo = poidsSakafoWeighted * race.prixAchatSakafo;

      const nbrAtody = situation.nombreAtody;
      const prixVenteAtodyEstimation = nbrAtody * race.prixVenteAtody;
      const poidsMoyenAkoho = nombreAkohoVivant > 0 ? poidsTotalAkoho : 0;

      const benefice =
        prixVente - coutSakafo - lot.prixAchat + prixVenteAtodyEstimation;

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
        race.name,
        lot.prixAchat,
        ageEnSemaine,
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
  static async calculPoidsSpecifique(pool, Race, dateDebut, dateFin) {
    const dDebut = new Date(dateDebut);
    const dFin = new Date(dateFin);

    dDebut.setHours(0, 0, 0, 0);
    dFin.setHours(0, 0, 0, 0);

    const differenceInMs = dFin - dDebut;
    const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffJours < 1) return 0;
    const grossissements = await GrossissementService.getGrossissementsByRace(
      pool,
      Race.idRace,
    );
    const grossissementsByAge = this.toGrossissementByAgeMap(grossissements);

    const g0 = grossissementsByAge.get(0);
    if (!g0) return 0;
    const poidsInitial = Number(g0.variation) || 0;

    let sommeGainHebdomadaire = 0;
    let prorataJours = 0;

    const scheduleAgeBase = 1;
    const ageActuelSemaine = scheduleAgeBase + Math.floor((diffJours - 1) / 7);
    const resteJours = ((diffJours - 1) % 7) + 1;

    let semaine = scheduleAgeBase;
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
      if (g) {
        prorataJours = (Number(g.variation) / 7) * resteJours;
      }
    }

    return poidsInitial + sommeGainHebdomadaire + prorataJours;
  }
}

module.exports = SituationFinanciereService;
