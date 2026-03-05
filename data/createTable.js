// backend/createDb.js
const sql = require("mssql");

const config = {
  user: "sa",
  password: "YourStrong!Pass1",
  server: "localhost", // or your Docker host IP
  options: { encrypt: false, trustServerCertificate: true },
};

async function createDatabaseAndTables() {
  try {
    const pool = await sql.connect(config);

    // Create database if not exists
    await pool.request().query(`
      IF DB_ID('akoho') IS NULL
        CREATE DATABASE akoho;
    `);

    // Use the database
    await pool.request().query("USE akoho");

    // Create tables
    await pool.request().query(`
      CREATE TABLE IF NOT EXISTS race (
        idRace INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        prixAchatSakafo DECIMAL(10,2) NOT NULL,
        prixVenteAkoho DECIMAL(10,2) NOT NULL,
        prixVenteAtody DECIMAL(10,2) NOT NULL
      );
    `);

    await pool.request().query(`
      CREATE TABLE IF NOT EXISTS lot (
        idLot INT IDENTITY(1,1) PRIMARY KEY,
        idRace INT NOT NULL,
        dateAchat DATE NOT NULL,
        nombreAkoho INT NOT NULL,
        prixAchat DECIMAL(10, 2) NOT NULL,
        age INT NOT NULL,
        FOREIGN KEY (idRace) REFERENCES race(idRace)
      );
    `);

    await pool.request().query(`
      CREATE TABLE IF NOT EXISTS situation (
        idSituation INT IDENTITY(1,1) PRIMARY KEY,
        idLot INT NOT NULL,
        dateSituation DATE NOT NULL,
        nombreAkohoVivant INT NOT NULL,
        nombreAkohoMort INT NOT NULL,
        nombreAtody INT NOT NULL,
        age INT NOT NULL,
        FOREIGN KEY (idLot) REFERENCES lot(idLot)
      );
    `);

    await pool.request().query(`
      CREATE TABLE grossissement (
        idGrossissement INT IDENTITY (1, 1) PRIMARY KEY,
        idRace INT NOT NULL,
        age INT NOT NULL,
        variation DECIMAL(10, 2) NOT NULL,
        poidsSakafo DECIMAL(10, 2) NOT NULL,
        CONSTRAINT FK_Grossissement_Race FOREIGN KEY (idRace) REFERENCES race (idRace)
      );
    `);

    console.log("✅ Database and tables created!");
    sql.close();
  } catch (err) {
    console.error("❌ Error creating database/tables:", err);
  }
}

createDatabaseAndTables();
