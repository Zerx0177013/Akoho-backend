const Situation = require("../models/Situation");
const Lot = require("../models/Lot");
const Evenement = require("../models/Evenement");
const EclosionService = require("./EclosionService");

class SituationService {
  static computeAgeInWeeks(dateAchat, initialAgeWeeks, dateSituation) {
    const normalizeDate = (value) => {
      if (value instanceof Date) {
        return new Date(
          Date.UTC(
            value.getUTCFullYear(),
            value.getUTCMonth(),
            value.getUTCDate(),
          ),
        );
      }

      const raw = String(value || "").trim();
      if (!raw) return new Date("invalid");

      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return new Date(`${raw}T00:00:00Z`);
      }

      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return parsed;

      return new Date(
        Date.UTC(
          parsed.getUTCFullYear(),
          parsed.getUTCMonth(),
          parsed.getUTCDate(),
        ),
      );
    };

    const purchaseDate = normalizeDate(dateAchat);
    const situationDate = normalizeDate(dateSituation);

    if (
      Number.isNaN(purchaseDate.getTime()) ||
      Number.isNaN(situationDate.getTime())
    ) {
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
    mortaliteFemellePourcentage = 0,
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

    const age = SituationService.computeAgeInWeeks(
      lot.dateAchat,
      lot.age,
      dateSituation,
    );

    if (Number(nombreAkohoMort) != 0) {
      if (
        mortaliteFemellePourcentage === null ||
        mortaliteFemellePourcentage === undefined ||
        Number(mortaliteFemellePourcentage) < 0 ||
        Number(mortaliteFemellePourcentage) > 100
      ) {
        throw new Error(
          "Mortalité Femelle Pourcentage must be between 0 and 100",
        );
      }
      await Evenement.createDeathAkohoEvent(
        pool,
        idLot,
        dateSituation,
        nombreAkohoMort,
      );
      const mrtTtl = Number(nombreAkohoMort);
      const mrtFemelle = Math.round(
        mrtTtl * (Number(mortaliteFemellePourcentage) / 100),
      );
      const mrtMale = mrtTtl - mrtFemelle;

      await Situation.addQuantityToMostRecentSituation(
        pool,
        idLot,
        dateSituation,
        Number(nombreAkohoVivant) - mrtTtl,
        mrtTtl,
        Number(nombreAtody),
        Number(age),
        0,
        -mrtMale,
        -mrtFemelle,
      );
    }
    if (Number(nombreAtody) != 0) {
      await Evenement.createAtodyDiscoveryEvent(
        pool,
        idLot,
        dateSituation,
        nombreAtody,
      );
      await Situation.addQuantityToMostRecentSituation(
        pool,
        idLot,
        dateSituation,
        0,
        0,
        Number(nombreAtody),
        Number(age),
        -Number(nombreAtody),
      );
      await EclosionService.ProcessEclosion2(
        pool,
        idLot,
        nombreAtody,
        dateSituation,
      );
    }
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
