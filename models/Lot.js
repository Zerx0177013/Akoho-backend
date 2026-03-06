class Lot {
  constructor(idLot, idRace, dateAchat, nombreAkoho, age, prixAchat) {
    this.idLot = idLot;
    this.idRace = idRace;
    this.dateAchat = dateAchat;
    this.nombreAkoho = nombreAkoho;
    this.age = age;
    this.prixAchat = prixAchat;
  }

  static async create(pool, idRace, dateAchat, nombreAkoho, age, prixAchat) {
    const query = `INSERT INTO lot (idRace, dateAchat, nombreAkoho, age, prixAchat)
                   VALUES (@idRace, @dateAchat, @nombreAkoho, @age, @prixAchat)`;
    const request = pool.request();
    request.input("idRace", idRace);
    request.input("dateAchat", dateAchat);
    request.input("nombreAkoho", nombreAkoho);
    request.input("age", age);
    request.input("prixAchat", prixAchat);
    return request.query(query);
  }
  static async createAtLotCreation(pool, idRace, dateAchat, nombreAkoho, age, prixAchat) {
    const query = `INSERT INTO lot (idRace, dateAchat, nombreAkoho, age, prixAchat)
                   OUTPUT INSERTED.idLot
                   VALUES (@idRace, @dateAchat, @nombreAkoho, @age, @prixAchat)`;
    const request = pool.request();
    request.input("idRace", idRace);
    request.input("dateAchat", dateAchat);
    request.input("nombreAkoho", nombreAkoho);
    request.input("age", age);
    request.input("prixAchat", prixAchat);
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
}

module.exports = Lot;
