class Lot {
  constructor(
    idLot,
    idRace,
    dateAchat,
    nombreAkoho,
    age,
    prixAchat,
    idLotParent = null,
    poidsInitial = 0,
  ) {
    this.idLot = idLot;
    this.idRace = idRace;
    this.dateAchat = dateAchat;
    this.nombreAkoho = nombreAkoho;
    this.age = age;
    this.prixAchat = prixAchat;
    this.idLotParent = idLotParent;
    this.poidsInitial = poidsInitial;
  }

  static async create(
    pool,
    idRace,
    dateAchat,
    nombreAkoho,
    age,
    prixAchat,
    idLotParent = null,
    poidsInitial = 0,
  ) {
    const query = `INSERT INTO lot (idRace, dateAchat, nombreAkoho, age, prixAchat, idLotParent, poidsInitial)
                   VALUES (@idRace, @dateAchat, @nombreAkoho, @age, @prixAchat, @idLotParent, @poidsInitial)`;
    const request = pool.request();
    request.input("idRace", idRace);
    request.input("dateAchat", dateAchat);
    request.input("nombreAkoho", nombreAkoho);
    request.input("age", age);
    request.input("prixAchat", prixAchat);
    request.input("idLotParent", idLotParent ?? null);
    request.input("poidsInitial", poidsInitial ?? 0);
    return request.query(query);
  }
  static async createAtLotCreation(
    pool,
    idRace,
    dateAchat,
    nombreAkoho,
    age,
    prixAchat,
    idLotParent = null,
    poidsInitial = 0,
  ) {
    const query = `INSERT INTO lot (idRace, dateAchat, nombreAkoho, age, prixAchat, idLotParent, poidsInitial)
                   OUTPUT INSERTED.idLot
                   VALUES (@idRace, @dateAchat, @nombreAkoho, @age, @prixAchat, @idLotParent, @poidsInitial)`;
    const request = pool.request();
    request.input("idRace", idRace);
    request.input("dateAchat", dateAchat);
    request.input("nombreAkoho", nombreAkoho);
    request.input("age", age);
    request.input("prixAchat", prixAchat);
    request.input("idLotParent", idLotParent ?? null);
    request.input("poidsInitial", poidsInitial ?? 0);
    return request.query(query);
  }

  static async findAll(pool) {
    return pool.request().query("SELECT * FROM lot");
  }

  static async findById(pool, idLot) {
    return pool
      .request()
      .input("idLot", idLot)
      .query("SELECT * FROM lot WHERE idLot = @idLot");
  }

  static async findByRace(pool, idRace) {
    return pool
      .request()
      .input("idRace", idRace)
      .query("SELECT * FROM lot WHERE idRace = @idRace");
  }

  static async getDateAchatById(pool, idLot) {
    const result = await pool
      .request()
      .input("idLot", idLot)
      .query("SELECT dateAchat FROM lot WHERE idLot = @idLot");
    return result.recordset[0]?.dateAchat;
  }

  
}

module.exports = Lot;
