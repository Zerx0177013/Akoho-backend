// backend/db.js
const sql = require('mssql');

const config = {
  user: 'sa',                    // ton user SQL Server
  password: 'YourStrong!Pass1',  // ton mot de passe
  server: 'localhost',            // ou IP de ton Docker SQL Server
  database: 'akoho',
  options: {
    encrypt: false,               // pour dev local
    trustServerCertificate: true
  }
};

// Créer un pool de connexions
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => console.log('❌ DB Connection Failed!', err));

module.exports = poolPromise;