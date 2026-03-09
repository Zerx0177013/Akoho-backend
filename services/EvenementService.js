class EvenementService {
  static async getEvenementsByLotAndDate(pool, idLot, dateEvenement) {
    const query = `
      SELECT e.*, te.libelle as typeLibelle,
             l.dateAchat, l.nombreAkoho, l.age as ageAchat, l.prixAchat,
             r.name as raceLibelle, r.prixAchatSakafo, r.prixVenteAkoho, r.prixVenteAtody
      FROM evenement e
      JOIN typeEvenement te ON e.idTypeEvenement = te.idTypeEvenement
      JOIN lot l ON e.idLot = l.idLot
      JOIN race r ON l.idRace = r.idRace
      WHERE e.idLot = @idLot
      AND e.dateEvenement <= @dateEvenement
    `;
    const request = pool.request();
    request.input("idLot", idLot);
    request.input("dateEvenement", dateEvenement);
    return request.query(query);
  }

  static async getEvenementsByLotAndDateSpecific(pool, idLot, idTypeEvenement, dateEvenement) {
    const query = `
      SELECT e.*, te.libelle as typeLibelle,
             l.dateAchat, l.nombreAkoho, l.age as ageAchat, l.prixAchat,
             r.name as raceLibelle, r.prixAchatSakafo, r.prixVenteAkoho, r.prixVenteAtody
      FROM evenement e
      JOIN typeEvenement te ON e.idTypeEvenement = te.idTypeEvenement
      JOIN lot l ON e.idLot = l.idLot
      JOIN race r ON l.idRace = r.idRace
      WHERE e.idLot = @idLot
      AND e.idTypeEvenement = @idTypeEvenement
      AND e.dateEvenement <= @dateEvenement
    `;
    const request = pool.request();
    request.input("idLot", idLot);
    request.input("idTypeEvenement", idTypeEvenement);
    request.input("dateEvenement", dateEvenement);
    return request.query(query);
  }
}
module.exports = EvenementService;