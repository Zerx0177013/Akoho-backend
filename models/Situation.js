class Situation {
  constructor(idSituation, idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible = 0, nombreAkohoLahy = 0, nombreAkohoVavy = 0) {
    this.idSituation = idSituation;
    this.idLot = idLot;
    this.dateSituation = dateSituation;
    this.nombreAkohoVivant = nombreAkohoVivant;
    this.nombreAkohoMort = nombreAkohoMort;
    this.nombreAtody = nombreAtody;
    this.age = age;
    this.nombreAtodyTotalPossible = nombreAtodyTotalPossible;
    this.nombreAkohoLahy = nombreAkohoLahy;
    this.nombreAkohoVavy = nombreAkohoVavy;
  }

  static async create(pool, idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible = 0, nombreAkohoLahy = 0, nombreAkohoVavy = 0) {
    const query = `INSERT INTO situation (idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible, nombreAkohoLahy, nombreAkohoVavy) 
                   VALUES (@idLot, @dateSituation, @nombreAkohoVivant, @nombreAkohoMort, @nombreAtody, @age, @nombreAtodyTotalPossible, @nombreAkohoLahy, @nombreAkohoVavy)`;
    const request = pool.request();
    request.input('idLot', idLot);
    request.input('dateSituation', dateSituation);
    request.input('nombreAkohoVivant', nombreAkohoVivant);
    request.input('nombreAkohoMort', nombreAkohoMort);
    request.input('nombreAtody', nombreAtody);
    request.input('age', age);
    request.input('nombreAtodyTotalPossible', nombreAtodyTotalPossible);
    request.input('nombreAkohoLahy', nombreAkohoLahy);
    request.input('nombreAkohoVavy', nombreAkohoVavy);
    return request.query(query);
  }
  

  static async findAll(pool) {
    return pool.request().query('SELECT * FROM situation');
  }

  static async findByLot(pool, idLot) {
    return pool.request().input('idLot', idLot).query('SELECT * FROM situation WHERE idLot = @idLot');
  }

  static async findMostRecentSituationByLot(pool, idLot) {
    return pool.request().input('idLot', idLot).query(`
      SELECT TOP 1 * 
      FROM situation 
      WHERE idLot = @idLot 
      ORDER BY dateSituation DESC,idSituation DESC
    `);
  }

  // static async findNearestByLotAndDate(pool, idLot, dateReference) {
  //   const request = pool.request();
  //   request.input('idLot', idLot);
  //   request.input('dateReference', dateReference);
  //   return request.query(`
  //     SELECT TOP 1 *
  //     FROM situation
  //     WHERE idLot = @idLot
  //     ORDER BY ABS(DATEDIFF(day, dateSituation, @dateReference)), dateSituation DESC
  //   `);
  // }

  static async findMostRecentByLotBeforeDate(pool, idLot, dateReference) {
    const request = pool.request();
    request.input('idLot', idLot);
    request.input('dateReference', dateReference);
    return request.query(`
      SELECT TOP 1 *
      FROM situation
      WHERE idLot = @idLot
        AND dateSituation <= @dateReference
      ORDER BY dateSituation DESC
    `);
  }

  static async findByLotBeforeDate(pool, idLot, dateReference) {
    const request = pool.request();
    request.input('idLot', idLot);
    request.input('dateReference', dateReference);
    return request.query(`
      SELECT *
      FROM situation
      WHERE idLot = @idLot
        AND dateSituation <= @dateReference
      ORDER BY dateSituation ASC
    `);
  }

  static async addQuantityToMostRecentSituation(pool, idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible = 0, nombreAkohoLahy = 0, nombreAkohoVavy = 0) {
    const recentSituationResult = await this.findMostRecentSituationByLot(pool, idLot);
    const recentSituation = recentSituationResult.recordset[0];

    if (!recentSituation) {
      throw new Error('No existing situation found for this lot');
    }

    const updatedVivant = recentSituation.nombreAkohoVivant + nombreAkohoVivant;
    const updatedMort = recentSituation.nombreAkohoMort + nombreAkohoMort;
    const updatedAtody = recentSituation.nombreAtody + nombreAtody;

    // We can also accumulate the new properties if desired or just pass them as new values/accumulated values
    const updatedAtodyTotalPossible = recentSituation.nombreAtodyTotalPossible + nombreAtodyTotalPossible;
    const updatedLahy = recentSituation.nombreAkohoLahy + nombreAkohoLahy;
    const updatedVavy = recentSituation.nombreAkohoVavy + nombreAkohoVavy;

    const query = `INSERT INTO situation (idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible, nombreAkohoLahy, nombreAkohoVavy) 
                   VALUES (@idLot, @dateSituation, @nombreAkohoVivant, @nombreAkohoMort, @nombreAtody, @age, @nombreAtodyTotalPossible, @nombreAkohoLahy, @nombreAkohoVavy)`;
    const request = pool.request();
    request.input('idLot', idLot);
    request.input('dateSituation', dateSituation);
    request.input('nombreAkohoVivant', updatedVivant);
    request.input('nombreAkohoMort', updatedMort);
    request.input('nombreAtody', updatedAtody);
    request.input('age', age);
    request.input('nombreAtodyTotalPossible', updatedAtodyTotalPossible);
    request.input('nombreAkohoLahy', updatedLahy);
    request.input('nombreAkohoVavy', updatedVavy);
    return request.query(query);
  }
}

module.exports = Situation;