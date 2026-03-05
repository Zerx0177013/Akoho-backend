class Race {
  constructor(idRace, name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody) {
    this.idRace = idRace;
    this.name = name;
    this.prixAchatSakafo = prixAchatSakafo;
    this.prixVenteAkoho = prixVenteAkoho;
    this.prixVenteAtody = prixVenteAtody;
  }

  static async create(pool, name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody) {
    const query = `INSERT INTO race (name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody) 
                   VALUES (@name, @prixAchatSakafo, @prixVenteAkoho, @prixVenteAtody)`;
    const request = pool.request();
    request.input('name', name);
    request.input('prixAchatSakafo', prixAchatSakafo);
    request.input('prixVenteAkoho', prixVenteAkoho);
    request.input('prixVenteAtody', prixVenteAtody);
    return request.query(query);
  }

  static async findAll(pool) {
    const query = 'SELECT * FROM race';
    return pool.request().query(query);
  }

  static async findById(pool, idRace) {
    const query = 'SELECT * FROM race WHERE idRace = @idRace';
    return pool.request().input('idRace', idRace).query(query);
  }
}

module.exports = Race;