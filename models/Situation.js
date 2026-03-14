class Situation {
  constructor(
    idSituation,
    idLot,
    dateSituation,
    nombreAkohoVivant,
    nombreAkohoMort,
    nombreAtody,
    age,
    nombreAtodyTotalPossible = 0,
    nombreAkohoLahy = 0,
    nombreAkohoVavy = 0,
  ) {
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

  static async create(
    pool,
    idLot,
    dateSituation,
    nombreAkohoVivant,
    nombreAkohoMort,
    nombreAtody,
    age,
    nombreAtodyTotalPossible = 0,
    nombreAkohoLahy = 0,
    nombreAkohoVavy = 0,
  ) {
    const query = `INSERT INTO situation (idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible, nombreAkohoLahy, nombreAkohoVavy) 
                   VALUES (@idLot, @dateSituation, @nombreAkohoVivant, @nombreAkohoMort, @nombreAtody, @age, @nombreAtodyTotalPossible, @nombreAkohoLahy, @nombreAkohoVavy)`;
    const request = pool.request();
    request.input("idLot", idLot);
    request.input("dateSituation", dateSituation);
    request.input("nombreAkohoVivant", nombreAkohoVivant);
    request.input("nombreAkohoMort", nombreAkohoMort);
    request.input("nombreAtody", nombreAtody);
    request.input("age", age);
    request.input("nombreAtodyTotalPossible", nombreAtodyTotalPossible);
    request.input("nombreAkohoLahy", nombreAkohoLahy);
    request.input("nombreAkohoVavy", nombreAkohoVavy);
    return request.query(query);
  }

  static async findAll(pool) {
    return pool.request().query("SELECT * FROM situation");
  }

  static async findByLot(pool, idLot) {
    return pool
      .request()
      .input("idLot", idLot)
      .query("SELECT * FROM situation WHERE idLot = @idLot");
  }

  static async findMostRecentSituationByLot(pool, idLot) {
    return pool.request().input("idLot", idLot).query(`
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
    request.input("idLot", idLot);
    request.input("dateReference", dateReference);
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
    request.input("idLot", idLot);
    request.input("dateReference", dateReference);
    return request.query(`
      SELECT *
      FROM situation
      WHERE idLot = @idLot
        AND dateSituation <= @dateReference
      ORDER BY dateSituation ASC
    `);
  }

  // static async addQuantityToMostRecentSituation(pool, idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible = 0, nombreAkohoLahy = 0, nombreAkohoVavy = 0) {
  //   const recentSituationResult = await this.findMostRecentSituationByLot(pool, idLot);
  //   const recentSituation = recentSituationResult.recordset[0];

  //   if (!recentSituation) {
  //     throw new Error('No existing situation found for this lot');
  //   }

  //   const updatedVivant = recentSituation.nombreAkohoVivant + nombreAkohoVivant;
  //   const updatedMort = recentSituation.nombreAkohoMort + nombreAkohoMort;
  //   const updatedAtody = recentSituation.nombreAtody + nombreAtody;

  //   // We can also accumulate the new properties if desired or just pass them as new values/accumulated values
  //   const updatedAtodyTotalPossible = recentSituation.nombreAtodyTotalPossible + nombreAtodyTotalPossible;
  //   const updatedLahy = recentSituation.nombreAkohoLahy + nombreAkohoLahy;
  //   const updatedVavy = recentSituation.nombreAkohoVavy + nombreAkohoVavy;

  //   const query = `INSERT INTO situation (idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age, nombreAtodyTotalPossible, nombreAkohoLahy, nombreAkohoVavy)
  //                  VALUES (@idLot, @dateSituation, @nombreAkohoVivant, @nombreAkohoMort, @nombreAtody, @age, @nombreAtodyTotalPossible, @nombreAkohoLahy, @nombreAkohoVavy)`;
  //   const request = pool.request();
  //   request.input('idLot', idLot);
  //   request.input('dateSituation', dateSituation);
  //   request.input('nombreAkohoVivant', updatedVivant);
  //   request.input('nombreAkohoMort', updatedMort);
  //   request.input('nombreAtody', updatedAtody);
  //   request.input('age', age);
  //   request.input('nombreAtodyTotalPossible', updatedAtodyTotalPossible);
  //   request.input('nombreAkohoLahy', updatedLahy);
  //   request.input('nombreAkohoVavy', updatedVavy);
  //   return request.query(query);
  // }

  static async addQuantityToMostRecentSituation(
    transaction,
    idLot,
    dateSituation,
    diffVivant,
    diffMort,
    diffAtody,
    age,
    diffPossible = 0,
    diffLahy = 0,
    diffVavy = 0,
  ) {
    // 1. Trouver la situation de référence (celle juste avant ou à la même date)
    const recentResult = await this.findMostRecentByLotBeforeDate(
      transaction,
      idLot,
      dateSituation,
    );
    const recent = recentResult.recordset[0];

    // On calcule les nouveaux totaux pour la ligne qu'on va insérer
    const newVivant =
      (Number(recent?.nombreAkohoVivant) || 0) + Number(diffVivant);
    const newMort = (Number(recent?.nombreAkohoMort) || 0) + Number(diffMort);
    const newAtody = (Number(recent?.nombreAtody) || 0) + Number(diffAtody);
    const newPossible =
      (Number(recent?.nombreAtodyTotalPossible) || 0) + Number(diffPossible);
    const newLahy = (Number(recent?.nombreAkohoLahy) || 0) + Number(diffLahy);
    const newVavy = (Number(recent?.nombreAkohoVavy) || 0) + Number(diffVavy);

    // 2. Insertion de la nouvelle ligne
    const insertQuery = `
        INSERT INTO situation (
            idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, 
            nombreAtody, age, nombreAtodyTotalPossible, nombreAkohoLahy, nombreAkohoVavy
        ) 
        OUTPUT INSERTED.idSituation
        VALUES (
            @idLot, @dateSituation, @newVivant, @newMort, 
            @newAtody, @age, @newPossible, @newLahy, @newVavy
        )
    `;

    const insertResult = await transaction
      .request()
      .input("idLot", idLot)
      .input("dateSituation", dateSituation)
      .input("newVivant", newVivant)
      .input("newMort", newMort)
      .input("newAtody", newAtody)
      .input("age", age)
      .input("newPossible", newPossible)
      .input("newLahy", newLahy)
      .input("newVavy", newVavy)
      .query(insertQuery);

    const newId = insertResult.recordset[0].idSituation;

    // 3. LA PROPAGATION : Mise à jour de toutes les lignes futures
    // On met à jour les lignes qui ont une date plus lointaine
    // OU la même date mais un ID supérieur (cas de plusieurs saisies le même jour)
    const updateFutureQuery = `
        UPDATE situation 
        SET 
            nombreAkohoVivant = nombreAkohoVivant + @diffVivant,
            nombreAkohoMort = nombreAkohoMort + @diffMort,
            nombreAtody = nombreAtody + @diffAtody,
            nombreAtodyTotalPossible = nombreAtodyTotalPossible + @diffPossible,
            nombreAkohoLahy = nombreAkohoLahy + @diffLahy,
            nombreAkohoVavy = nombreAkohoVavy + @diffVavy
        WHERE idLot = @idLot 
          AND (
            dateSituation > @dateSituation 
            OR (dateSituation = @dateSituation AND idSituation > @newId)
          )
    `;

    await transaction
      .request()
      .input("idLot", idLot)
      .input("dateSituation", dateSituation)
      .input("newId", newId)
      .input("diffVivant", diffVivant)
      .input("diffMort", diffMort)
      .input("diffAtody", diffAtody)
      .input("diffPossible", diffPossible)
      .input("diffLahy", diffLahy)
      .input("diffVavy", diffVavy)
      .query(updateFutureQuery);

    return insertResult;
  }
}

module.exports = Situation;
