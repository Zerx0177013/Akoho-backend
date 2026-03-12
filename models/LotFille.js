class LotFille {
  constructor(idLotFille, idLot, nombreAkohoFemelle, nombreAkohoMale) {
    this.idLotFille = idLotFille;
    this.idLot = idLot;
    this.nombreAkohoFemelle = nombreAkohoFemelle;
    this.nombreAkohoMale = nombreAkohoMale;
  }

  static async create(pool, idLot, nombreAkohoFemelle, nombreAkohoMale) {
    const query = `INSERT INTO lotFille (idLot, nombreAkohoFemelle, nombreAkohoMale)
                   OUTPUT INSERTED.idLotFille
                   VALUES (@idLot, @nombreAkohoFemelle, @nombreAkohoMale)`;
    const request = pool.request();
    request.input("idLot", idLot);
    request.input("nombreAkohoFemelle", nombreAkohoFemelle);
    request.input("nombreAkohoMale", nombreAkohoMale);
    return request.query(query);
  }

  static async findByLot(pool, idLot) {
    return pool
      .request()
      .input("idLot", idLot)
      .query("SELECT * FROM lotFille WHERE idLot = @idLot");
  }

  static async findAll(pool) {
    return pool.request().query("SELECT * FROM lotFille");
  }
}

module.exports = LotFille;
