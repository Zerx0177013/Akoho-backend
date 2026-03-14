class Race {
  constructor(idRace, name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody, sexualiteFemelle, oeufPondueMax, mortaliteAtody, incubation) {
    this.idRace = idRace;
    this.name = name;
    this.prixAchatSakafo = prixAchatSakafo;
    this.prixVenteAkoho = prixVenteAkoho;
    this.prixVenteAtody = prixVenteAtody;
    this.sexualiteFemelle = sexualiteFemelle;
    this.oeufPondueMax = oeufPondueMax;
    this.mortaliteAtody = mortaliteAtody;
    this.incubation = incubation;
  }

  static async create(pool, name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody, sexualiteFemelle, oeufPondueMax, mortaliteAtody, incubation) {
    const query = `INSERT INTO race (name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody, sexualiteFemelle, oeufPondueMax, mortaliteAtody, incubation) 
                   VALUES (@name, @prixAchatSakafo, @prixVenteAkoho, @prixVenteAtody, @sexualiteFemelle, @oeufPondueMax, @mortaliteAtody, @incubation)`;
    const request = pool.request();
    request.input('name', name);
    request.input('prixAchatSakafo', prixAchatSakafo);
    request.input('prixVenteAkoho', prixVenteAkoho);
    request.input('prixVenteAtody', prixVenteAtody);
    request.input('sexualiteFemelle', sexualiteFemelle);
    request.input('oeufPondueMax', oeufPondueMax);
    request.input('mortaliteAtody', mortaliteAtody);
    request.input('incubation', incubation);
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