const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'helloproperties',
  password: 'admin',
  port: 5432,
});
async function check() {
  try {
    const p = await pool.query('SELECT id, property_id, title, latitude, longitude, location FROM properties WHERE property_id = $1 OR id = $1', [399]);
    const r = await pool.query('SELECT id, requirement_id, requirement_title, latitude, longitude, preferred_coordinates, preferred_location FROM buy_requirements WHERE requirement_id = $1 OR id = $1', [139]);
    console.log('Property 399:', p.rows);
    console.log('Requirement 139:', r.rows);
  } catch (e) {
    console.log(e);
  }
  process.exit();
}
check();
