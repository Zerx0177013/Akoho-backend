class Evenement {
  static TYPE = {
    MORT: 1,
    ECLOSION: 2,
    ATODY_ARINA: 3
  };

  static async #insertEvenement(pool, idLot, idTypeEvenement, dateEvenement, quantite) {
    const query = `INSERT INTO evenement (idLot, idTypeEvenement, dateEvenement, quantite)
                   VALUES (@idLot, @idTypeEvenement, @dateEvenement, @quantite)`;
    const request = pool.request();
    request.input("idLot", idLot);
    request.input("idTypeEvenement", idTypeEvenement);
    request.input("dateEvenement", dateEvenement);
    request.input("quantite", quantite);
    return request.query(query);
  }

  static async createEclosionEvent(pool, idLot, dateEvenement, quantite) {
    return this.#insertEvenement(pool, idLot, this.TYPE.ECLOSION, dateEvenement, quantite);
  }

  static async createDeathAkohoEvent(pool, idLot, dateEvenement, quantite) {
    return this.#insertEvenement(pool, idLot, this.TYPE.MORT, dateEvenement, quantite);
  }
}