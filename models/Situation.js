class Situation {
  constructor(idSituation, idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age) {
    this.idSituation = idSituation;
    this.idLot = idLot;
    this.dateSituation = dateSituation;
    this.nombreAkohoVivant = nombreAkohoVivant;
    this.nombreAkohoMort = nombreAkohoMort;
    this.nombreAtody = nombreAtody;
    this.age = age;
  }

  static async create(pool, idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age) {
    const query = `INSERT INTO situation (idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age) 
                   VALUES (@idLot, @dateSituation, @nombreAkohoVivant, @nombreAkohoMort, @nombreAtody, @age)`;
    const request = pool.request();
    request.input('idLot', idLot);
    request.input('dateSituation', dateSituation);
    request.input('nombreAkohoVivant', nombreAkohoVivant);
    request.input('nombreAkohoMort', nombreAkohoMort);
    request.input('nombreAtody', nombreAtody);
    request.input('age', age);
    return request.query(query);
  }

  static async findAll(pool) {
    return pool.request().query('SELECT * FROM situation');
  }

  static async findByLot(pool, idLot) {
    return pool.request().input('idLot', idLot).query('SELECT * FROM situation WHERE idLot = @idLot');
  }
}

module.exports = Situation;