const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_MQkWszYw1Cx0@ep-twilight-queen-azaurtqd-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function alterTable() {
  try {
    await client.connect();
    await client.query('ALTER TABLE buy_requirements ADD COLUMN interested_property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL;');
    console.log("Column interested_property_id added successfully!");
  } catch (err) {
    console.error("Error adding column (maybe it already exists?):", err.message);
  } finally {
    await client.end();
  }
}

alterTable();
