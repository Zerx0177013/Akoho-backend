// backend/testDb.js
const poolPromise = require('./db');

async function test() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 AS test');
    console.log('Query result:', result.recordset);
  } catch (err) {
    console.error('Error querying database:', err);
  }
}

test();