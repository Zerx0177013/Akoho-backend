class Grossissement {
  constructor(idGrossissement, idRace, age, variation, poidsSakafo) {
    this.idGrossissement = idGrossissement;
    this.idRace = idRace;
    this.age = age;
    this.variation = variation;
    this.poidsSakafo = poidsSakafo;
  }

  static async create(pool, idRace, age, variation, poidsSakafo) {
    const query = `INSERT INTO grossissement (idRace, age, variation, poidsSakafo) 
                   VALUES (@idRace, @age, @variation, @poidsSakafo)`;
    const request = pool.request();
    request.input('idRace', idRace);
    request.input('age', age);
    request.input('variation', variation);
    request.input('poidsSakafo', poidsSakafo);
    return request.query(query);
  }

  static async createBulk(pool, idRace, rows) {
    // Build a single INSERT with multiple VALUES rows and unique param names
    const request = pool.request();
    request.input('idRace', idRace);

    const valueClauses = rows.map((row, i) => {
      request.input(`age${i}`, row.age);
      request.input(`variation${i}`, row.variation);
      request.input(`poidsSakafo${i}`, row.poidsSakafo);
      return `(@idRace, @age${i}, @variation${i}, @poidsSakafo${i})`;
    });

    const query = `INSERT INTO grossissement (idRace, age, variation, poidsSakafo) VALUES ${valueClauses.join(', ')}`;
    return request.query(query);
  }

  static async findAll(pool) {
    return pool.request().query('SELECT * FROM grossissement');
  }

  static async findByRace(pool, idRace) {
    return pool.request().input('idRace', idRace).query('SELECT * FROM grossissement WHERE idRace = @idRace');
  }

  static async findByAge(pool, age) {
    return pool.request().input('age', age).query('SELECT * FROM grossissement WHERE age = @age');
  }

  static async findByRaceAndAge(pool, idRace, age) {
    const request = pool.request();
    request.input('idRace', idRace);
    request.input('age', age);
    return request.query('SELECT * FROM grossissement WHERE idRace = @idRace AND age = @age');
  }
}

module.exports = Grossissement;
