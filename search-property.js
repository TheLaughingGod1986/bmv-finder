const fs = require('fs');
const readline = require('readline');

async function searchProperty() {
  const fileStream = fs.createReadStream('pp-complete.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  const results = [];

  for await (const line of rl) {
    count++;
    if (count % 100000 === 0) {
      console.log(`Processed ${count.toLocaleString()} lines...`);
    }

    // Check if line contains NE5 2PR and FOURSTONES
    if (line.includes('NE5 2PR') && line.includes('FOURSTONES')) {
      // Parse CSV line (simple approach)
      const parts = line.split('","');
      if (parts.length >= 15) {
        const price = parts[1]?.replace(/"/g, '');
        const date = parts[2]?.replace(/"/g, '').split(' ')[0];
        const postcode = parts[3]?.replace(/"/g, '');
        const paon = parts[7]?.replace(/"/g, '');
        const street = parts[9]?.replace(/"/g, '');
        
        if (paon === '21') {
          results.push({
            price: parseInt(price),
            date: date,
            postcode: postcode,
            paon: paon,
            street: street
          });
        }
      }
    }
  }

  console.log('\n=== 21 FOURSTONES SALES FOUND ===');
  results.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  results.forEach((sale, index) => {
    console.log(`${index + 1}. £${sale.price.toLocaleString()} - ${sale.date} (${sale.paon} ${sale.street})`);
  });

  console.log(`\nTotal sales found: ${results.length}`);
}

searchProperty().catch(console.error); 