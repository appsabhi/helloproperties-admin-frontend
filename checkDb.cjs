const pool = require('../backend/config/db.js');

async function check() {
  const p = await pool.query('SELECT id, property_id, title FROM properties WHERE property_id = $1 OR id = $1', [399]);
  const r = await pool.query('SELECT id, requirement_id, requirement_title FROM buy_requirements WHERE requirement_id = $1 OR id = $1', [139]);
  console.log('Property 399:', p.rows);
  console.log('Requirement 139:', r.rows);
  process.exit();
}
check();
