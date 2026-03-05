// backend/insertData.js
const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'YourStrong!Pass1',
  server: 'localhost',  // or Docker host IP
  database: 'akoho',
  options: { encrypt: false, trustServerCertificate: true }
};

async function insertSampleData() {
  try {
    const pool = await sql.connect(config);

    // Insert sample races
    await pool.request().query(`
      INSERT INTO race (name, prixAchatSakafo, prixVenteAkoho, prixVenteAtody)
      VALUES 
        ('Leghorn', 5.50, 15.00, 0.50),
        ('Rhode Island Red', 6.00, 18.00, 0.60),
        ('Plymouth Rock', 5.75, 16.50, 0.55);
    `);

    // Insert sample lots
    await pool.request().query(`
      INSERT INTO lot (idRace, dateAchat, nombreAkoho, age)
      VALUES
        (1, '2026-03-01', 50, 1),
        (2, '2026-03-02', 40, 2),
        (3, '2026-03-03', 60, 1);
    `);

    // Insert sample situations
    await pool.request().query(`
      INSERT INTO situation (idLot, dateSituation, nombreAkohoVivant, nombreAkohoMort, nombreAtody, age)
      VALUES
        (1, '2026-03-04', 48, 2, 5, 1),
        (2, '2026-03-04', 39, 1, 3, 2),
        (3, '2026-03-04', 59, 1, 4, 1);
    `);

    // Insert sample grossissements
    // await pool.request().query(`
    //   INSERT INTO grossissement (idSemaine, idRace, variation, poidsSakafo)
    //   VALUES
    //     (0, 1, 150, 0),
    //     (1, 1, 30, 40),
    //     (2, 1, 40, 50);
    // `);

    console.log('✅ Sample data inserted!');
    sql.close();
  } catch (err) {
    console.error('❌ Error inserting sample data:', err);
  }
}

insertSampleData();