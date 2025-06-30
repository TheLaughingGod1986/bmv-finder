const fs = require('fs');
const path = require('path');
const readline = require('readline');

const INPUT_CSV = path.join(__dirname, '../pp-complete.csv');
const OUTPUT_CSV = path.join(__dirname, '../pp-complete-cleaned.csv');

async function cleanHeadersStream() {
  const input = fs.createReadStream(INPUT_CSV);
  const output = fs.createWriteStream(OUTPUT_CSV);
  const rl = readline.createInterface({ input });

  let isFirstLine = true;
  let cleanedHeaders = [];
  let headerLength = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      // Split header line by comma, handle quoted fields
      const headers = line.match(/(?:"[^"]*"|[^,])+/g) || line.split(',');
      cleanedHeaders = headers.map((header, idx) => {
        const h = header.replace(/^"|"$/g, '');
        if (h && h.trim() !== '') return h;
        return `field_${idx + 1}`;
      });
      headerLength = cleanedHeaders.length;
      output.write(cleanedHeaders.join(',') + '\n');
      isFirstLine = false;
    } else {
      // Write the line as-is, but ensure it has the same number of columns as the header
      // If not, pad with empty fields or trim
      let columns = line.match(/(?:"[^"]*"|[^,])+/g) || line.split(',');
      if (columns.length < headerLength) {
        columns = columns.concat(Array(headerLength - columns.length).fill(''));
      } else if (columns.length > headerLength) {
        columns = columns.slice(0, headerLength);
      }
      output.write(columns.join(',') + '\n');
    }
  }
  output.end();
  console.log('CSV header cleaning complete. Output:', OUTPUT_CSV);
}

cleanHeadersStream(); 