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

  // static async calculPoidsTotalAkoho(
  //   pool,
  //   idLot,
  //   dateSituation,
  //   grossissementsByAge = null,
  // ) {
  //   const situationResult = await Situation.findNearestByLotAndDate(
  //     pool,
  //     idLot,
  //     dateSituation,
  //   );
  //   const situation = situationResult.recordset[0];
  //   if (!situation) {
  //     throw new Error("No situation found for this lot and date");
  //   }

  //   const lotActuel = await LotService.getLotById(pool, idLot);
  //   const dateAchat = new Date(lotActuel.dateAchat);
  //   const dateSit = new Date(dateSituation);

  //   const differenceInMs = dateSit - dateAchat;
  //   const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

  //   if (!grossissementsByAge) {
  //     const grossissements = await GrossissementService.getGrossissementsByRace(
  //       pool,
  //       lotActuel.idRace,
  //     );
  //     grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
  //   }

  //   // PoidsMoyen = PoidsInitial(S0) + ΣGainHebdomadaire(S1..Sn) + ProrataJours
  //   const grossissement0 = grossissementsByAge.get(0);
  //   if (!grossissement0) return 0;

  //   const isFromEclosion =
  //     lotActuel.idLotParent !== null && lotActuel.idLotParent !== undefined;
  //   const poidsInitial = isFromEclosion
  //     ? Number(grossissement0.variation) || 0
  //     : Number(lotActuel.poidsInitial) || Number(grossissement0.variation) || 0;
  //   let sommeGainHebdomadaire = 0;
  //   let prorataJours = 0;

  //   // Growth schedule starts from lot age week + 1 (purchased at age N -> first growth week is N+1)
  //   const ageLot = Number(lotActuel.age);
  //   const scheduleAgeBase = ageLot + 1;
  //   const ageActuelSemaine = scheduleAgeBase + Math.floor(diffJours / 7);
  //   const resteJours = diffJours % 7;

  //   // ΣGainHebdomadaire : sum of fully completed weeks since purchase
  //   let semaine = scheduleAgeBase;
  //   while (semaine < ageActuelSemaine) {
  //     const g = grossissementsByAge.get(semaine);

  //     if (g) {
  //       sommeGainHebdomadaire += Number(g.variation) || 0;
  //     } else {
  //       break;
  //     }

  //     semaine++;
  //   }

  //   // ProrataJours : gain proportionnel sur la semaine en cours
  //   if (resteJours > 0) {
  //     const g = grossissementsByAge.get(semaine);
  //     if (g) prorataJours = ((Number(g.variation) || 0) / 7) * resteJours;
  //   }

  //   return poidsInitial + sommeGainHebdomadaire + prorataJours;
  // }

  static async calculPoidsTotalAkoho(
    pool,
    idLot,
    dateSituation,
    grossissementsByAge = null,
  ) {
    // ... (récupération situation et lot inchangée) ...
    const lotActuel = await LotService.getLotById(pool, idLot);
    const dateAchat = new Date(lotActuel.dateAchat);
    const dateSit = new Date(dateSituation);

    // Normalisation pour inclure le jour même
    dateAchat.setHours(0, 0, 0, 0);
    dateSit.setHours(0, 0, 0, 0);

    const differenceInMs = dateSit - dateAchat;
    // +1 pour que le jour de l'achat compte comme le 1er jour de croissance
    const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffJours < 1) return 0; // Sécurité

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

    // On calcule l'âge actuel en fonction du diffJours inclusif
    // (diffJours - 1) car le 7ème jour doit clore la semaine
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

    // ProrataJours : calculé dès le premier jour (resteJours sera au moins 1)
    if (resteJours > 0) {
      const g = grossissementsByAge.get(semaine);
      if (g) prorataJours = ((Number(g.variation) || 0) / 7) * resteJours;
    }

    return poidsInitial + sommeGainHebdomadaire + prorataJours;
  }
  /**
   * Pure computation: cumulative food weight per chicken from dateAchat to targetDate.
   * No DB calls – all inputs are plain values.
   */
  // static _cumulativePoidsSakafo(lotAge, dateAchat, targetDate, grossissementsByAge) {
  //   const dAchat = new Date(dateAchat);
  //   const dTarget = new Date(targetDate);
  //   const differenceInMs = dTarget - dAchat;
  //   const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

  //   if (diffJours <= 0) return 0;

  //   let totalPoidsSakafo = 0;
  //   const age = Number(lotAge);
  //   const scheduleAgeBase = age + 1;
  //   const ageActuelSemaine = scheduleAgeBase + Math.floor(diffJours / 7) + 1;
  //   const resteJours = diffJours % 7;

  //   let lastGrossissement = this.getLastGrossissementAtOrBeforeAge(
  //     grossissementsByAge,
  //     ageActuelSemaine,
  //   );
  //   let semaine = scheduleAgeBase;

  //   while (semaine < ageActuelSemaine) {
  //     const g = grossissementsByAge.get(semaine);
  //     if (g) {
  //       lastGrossissement = g;
  //       totalPoidsSakafo += g.poidsSakafo;
  //     } else if (lastGrossissement) {
  //       totalPoidsSakafo += lastGrossissement.poidsSakafo;
  //     } else {
  //       break;
  //     }
  //     semaine++;
  //   }

  //   if (resteJours > 0) {
  //     const g = grossissementsByAge.get(semaine);
  //     const gToUse = g || lastGrossissement;
  //     if (gToUse) totalPoidsSakafo += (gToUse.poidsSakafo / 7) * resteJours;
  //   }

  //   return totalPoidsSakafo;
  // }

  static _cumulativePoidsSakafo(
    lotAge,
    dateAchat,
    targetDate,
    grossissementsByAge,
  ) {
    const dAchat = new Date(dateAchat);
    const dTarget = new Date(targetDate);

    // On met les deux dates à minuit pour comparer uniquement les jours calendaires
    dAchat.setHours(0, 0, 0, 0);
    dTarget.setHours(0, 0, 0, 0);

    const differenceInMs = dTarget - dAchat;
    // +1 pour inclure le jour même (J+0 = 1 jour de consommation)
    const diffJours = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;

    // Sécurité : si la date cible est vraiment avant l'achat
    if (diffJours < 1) return 0;

    let totalPoidsSakafo = 0;
    const age = Number(lotAge);
    const scheduleAgeBase = age + 1;

    // Le calcul des semaines et jours reste basé sur ce diffJours inclusif
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
      const g = grossissementsByAge.get(scheduleAgeBase);
      const gToUse = g || lastGrossissement;
      if (gToUse) totalPoidsSakafo += gToUse.poidsSakafo / 7;
    }

    return totalPoidsSakafo;
  }

  /**
   * Calculates the total weighted food consumption across all situations of a lot.
   *
   * Instead of: totalFoodPerChicken × currentAliveCount (inaccurate),
   * we compute:  Σ (foodPerChickenInSegment × aliveCountDuringSegment)
   *
   * Each segment spans from one situation's date to the next (or to dateSituation
   * for the last segment). Dead chickens are properly accounted for because they
   * are only counted in the segments where they were still alive.
   *
   * Returns the total weighted poidsSakafo (food weight, not money).
   * Multiply by prixAchatSakafo to get the monetary cost.
   */
  // static async calculPoidsSakafoWeighted(
  //   pool,
  //   idLot,
  //   dateSituation,
  //   grossissementsByAge = null,
  // ) {
  //   const lotActuel = await LotService.getLotById(pool, idLot);
  //   const dateAchat = new Date(lotActuel.dateAchat);
  //   const dateSit = new Date(dateSituation);

  //   if (dateSit < dateAchat) return 0;

  //   if (!grossissementsByAge) {
  //     const grossissements = await GrossissementService.getGrossissementsByRace(
  //       pool,
  //       lotActuel.idRace,
  //     );
  //     grossissementsByAge = this.toGrossissementByAgeMap(grossissements);
  //   }

  //   // Fetch all situations for this lot up to dateSituation, ordered by date ASC
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

  //     // Segment end = next situation's date, or dateSituation for the last segment
  //     let segmentEnd;
  //     if (i + 1 < situations.length) {
  //       segmentEnd = new Date(situations[i + 1].dateSituation);
  //     } else {
  //       segmentEnd = dateSit;
  //     }

  //     // Skip zero-duration segments (unless it's the only/last segment on dateSituation)
  //     if (segmentStart >= segmentEnd) continue;

  //     // Food per chicken from dateAchat→segmentEnd minus dateAchat→segmentStart
  //     const cumulativeAtStart = this._cumulativePoidsSakafo(
  //       lotActuel.age,
  //       dateAchat,
  //       segmentStart,
  //       grossissementsByAge,
  //     );
  //     const cumulativeAtEnd = this._cumulativePoidsSakafo(
  //       lotActuel.age,
  //       dateAchat,
  //       segmentEnd,
  //       grossissementsByAge,
  //     );
  //     const segmentPoidsSakafo = cumulativeAtEnd - cumulativeAtStart;

  //     // Multiply by the number of living chickens during this segment
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

    // Normalisation pour ignorer les heures/minutes
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

      let segmentEnd;
      if (i + 1 < situations.length) {
        segmentEnd = new Date(situations[i + 1].dateSituation);
      } else {
        segmentEnd = dateSit;
      }
      segmentEnd.setHours(0, 0, 0, 0);

      // Skip segments incohérents
      if (segmentStart > segmentEnd) continue;

      // CALCUL DU SEGMENT INCLUSIF
      const cumulativeAtEnd = this._cumulativePoidsSakafo(
        lotActuel.age,
        dateAchat,
        segmentEnd,
        grossissementsByAge,
      );

      let segmentPoidsSakafo;

      // Si la situation commence le jour même de l'achat
      if (segmentStart.getTime() === dateAchat.getTime()) {
        // On prend tout le cumulé jusqu'à la fin du segment (incluant J+0)
        segmentPoidsSakafo = cumulativeAtEnd;
      } else {
        // Sinon, on fait la différence classique
        const cumulativeAtStart = this._cumulativePoidsSakafo(
          lotActuel.age,
          dateAchat,
          segmentStart,
          grossissementsByAge,
        );
        // On recule d'un jour le start pour ne pas soustraire la ration du jour de transition
        segmentPoidsSakafo = cumulativeAtEnd - cumulativeAtStart;
      }

      const nombreVivant = Number(currentSituation.nombreAkohoVivant || 0);
      totalWeightedPoidsSakafo += segmentPoidsSakafo * nombreVivant;
    }

    return totalWeightedPoidsSakafo;
  }

  /**
   * Same as calculPoidsSakafoWeighted but when lot.age === 1,
   * the chicken doesn't eat on the purchase day (starts the day after).
   */
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

    // When age at purchase is 1, feeding starts the day after purchase
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

    // Fetch all situations for this lot up to dateSituation, ordered by date ASC
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

      // Clamp segment start to effectiveDateAchat (skip the purchase day)
      if (segmentStart < effectiveDateAchat) {
        segmentStart = effectiveDateAchat;
      }

      // Segment end = next situation's date, or dateSituation for the last segment
      let segmentEnd;
      if (i + 1 < situations.length) {
        segmentEnd = new Date(situations[i + 1].dateSituation);
      } else {
        segmentEnd = dateSit;
      }

      // Clamp segment end too
      if (segmentEnd < effectiveDateAchat) continue;

      // Skip zero-duration segments
      if (segmentStart >= segmentEnd) continue;

      // Food per chicken: cumulative from effectiveDateAchat→segmentEnd minus effectiveDateAchat→segmentStart
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

      // Multiply by the number of living chickens during this segment
      const nombreVivant = Number(currentSituation.nombreAkohoVivant || 0);
      totalWeightedPoidsSakafo += segmentPoidsSakafo * nombreVivant;
    }

    return totalWeightedPoidsSakafo;
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
      // age 1 + diffJours forced to 0 → no food on purchase day
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

      // Weighted food cost: accounts for mortality across all situations
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
      // poidsSakafoWeighted already includes the per-segment chicken counts
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
