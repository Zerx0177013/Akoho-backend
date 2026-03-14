const Situation = require("../models/Situation");
const Evenement = require("../models/Evenement");

class DeathService {
  //   static async processDeath(
  //     pool,
  //     idLot,
  //     dateSituation,
  //     nombreAkohoVivant,
  //     nombreAkohoMort,
  //     nombreAtody,
  //     age,
  //     mortaliteFemellePourcentage
  //   ) {
  //     const mrtTtl = Number(nombreAkohoMort);
  //     const mrtFemelle = Math.round(
  //       mrtTtl * (Number(mortaliteFemellePourcentage) / 100),
  //     );
  //     const mrtMale = mrtTtl - mrtFemelle;

  //     if (mrtMale > 0) {
  //       await Evenement.createDeathAkohoLahyEvent(pool, idLot, dateSituation, mrtMale);
  //     }
  //     if (mrtFemelle > 0) {
  //       await Evenement.createDeathAkohoVavyEvent(pool, idLot, dateSituation, mrtFemelle);
  //     }

  //     return Situation.addQuantityToMostRecentSituation(
  //       pool,
  //       idLot,
  //       dateSituation,
  //       -mrtTtl,
  //       mrtTtl,
  //       0,
  //       Number(age),
  //       0,
  //       -mrtMale,
  //       -mrtFemelle,
  //     );
  //   }

  static async processDeath(
    pool,
    idLot,
    dateSituation,
    nombreAkohoVivant,
    nombreAkohoMort,
    nombreAtody,
    age,
    mortaliteFemellePourcentage,
  ) {
    const mrtTtl = Number(nombreAkohoMort);

    // 1. Récupérer la situation juste avant ce décès
    const recentSituationResult = await Situation.findMostRecentByLotBeforeDate(
      pool,
      idLot,
      dateSituation,
    );
    const recentSituation = recentSituationResult.recordset[0];

    let mrtFemelle = 0;
    let mrtMale = 0;
    let diffPossible = 0;

    if (recentSituation) {
      const totalVavyActuel = Number(recentSituation.nombreAkohoVavy || 0);
      const totalLahyActuel = Number(recentSituation.nombreAkohoLahy || 0);

      // DETERMINATION DE LA REPARTITION DES MORTS
      if (totalLahyActuel === 0 && totalVavyActuel > 0) {
        // Cas 100% Femelles : tous les morts sont des femelles
        mrtFemelle = mrtTtl;
        mrtMale = 0;
      } else if (totalVavyActuel === 0 && totalLahyActuel > 0) {
        // Cas 100% Mâles : tous les morts sont des mâles
        mrtFemelle = 0;
        mrtMale = mrtTtl;
      } else {
        // Cas mixte : on applique le pourcentage fourni
        mrtFemelle = Math.round(
          mrtTtl * (Number(mortaliteFemellePourcentage) / 100),
        );
        mrtMale = mrtTtl - mrtFemelle;
      }

      // CALCUL DE LA PERTE DE POTENTIEL (si des femelles sont mortes)
      if (mrtFemelle > 0 && totalVavyActuel > 0) {
        const totalPossibleActuel = Number(
          recentSituation.nombreAtodyTotalPossible || 0,
        );
        const potentielMoyenParFemelle = totalPossibleActuel / totalVavyActuel;
        diffPossible = -Math.round(mrtFemelle * potentielMoyenParFemelle);
      }
    } else {
      // Fallback si aucune situation n'existe encore
      mrtFemelle = Math.round(
        mrtTtl * (Number(mortaliteFemellePourcentage) / 100),
      );
      mrtMale = mrtTtl - mrtFemelle;
    }

    // 2. Enregistrement des événements par sexe
    if (mrtMale > 0) {
      await Evenement.createDeathAkohoLahyEvent(
        pool,
        idLot,
        dateSituation,
        mrtMale,
      );
    }
    if (mrtFemelle > 0) {
      await Evenement.createDeathAkohoVavyEvent(
        pool,
        idLot,
        dateSituation,
        mrtFemelle,
      );
    }

    // 3. Mise à jour de la situation (cumulative)
    return Situation.addQuantityToMostRecentSituation(
      pool,
      idLot,
      dateSituation,
      -mrtTtl, // diffVivant
      mrtTtl, // diffMort
      0, // diffAtody (sera géré par l'insertion suivante)
      Number(age),
      diffPossible, // Déduction automatique du potentiel de ponte
      -mrtMale, // diffLahy
      -mrtFemelle, // diffVavy
    );
  }
}

module.exports = DeathService;
