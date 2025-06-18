const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./land_registry.db');

const postcode = process.argv[2] || 'SW1A1AA'; // Pass postcode as argument, default to SW1A1AA

// Remove spaces and uppercase for matching
const searchPostcode = postcode.replace(/\s/g, '').toUpperCase();

db.all(
  `SELECT * FROM prices WHERE REPLACE(UPPER(postcode), ' ', '') = ? ORDER BY date_of_transfer DESC LIMIT 20`,
  [searchPostcode],
  (err, rows) => {
    if (err) throw err;
    console.log(rows);
    db.close();
  }
); 