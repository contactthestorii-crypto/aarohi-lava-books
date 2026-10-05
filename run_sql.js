const fs = require('fs');
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: '2406:da14:25a:5800::575f',
    user: 'postgres',
    password: 'Samkay@0509',
    database: 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected! Reading SQL...');
    
    const sql = fs.readFileSync('supabase/init.sql', 'utf8');
    console.log('Executing SQL (this may take a moment)...');
    
    await client.query(sql);
    console.log('Successfully executed all migrations!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

