const fs = require('fs');
const path = require('path');

/**
 * Combine all certificates.csv files in data/epc-csv/ into one CSV.
 * Keeps only the first header. Deletes originals after combining.
 */
async function combineEpcCertificates({
  inputDir = path.join(__dirname, '../data/epc-csv/'),
  outputFile = path.join(__dirname, '../data/epc-certificates-combined.csv'),
  removeOriginals = true,
} = {}) {
  // Recursively find all certificates.csv files
  function findCertificates(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findCertificates(filePath));
      } else if (file === 'certificates.csv') {
        results.push(filePath);
      }
    }
    return results;
  }

  const certFiles = findCertificates(inputDir);
  if (certFiles.length === 0) {
    console.log('No certificates.csv files found.');
    return;
  }
  console.log(`Found ${certFiles.length} certificates.csv files.`);

  // Combine files
  let headerWritten = false;
  const outStream = fs.createWriteStream(outputFile);
  for (const [i, file] of certFiles.entries()) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    if (!headerWritten) {
      outStream.write(lines[0] + '\n');
      headerWritten = true;
    }
    // Write data lines (skip header)
    for (let j = 1; j < lines.length; j++) {
      if (lines[j].trim()) outStream.write(lines[j] + '\n');
    }
    console.log(`Processed ${i + 1}/${certFiles.length}: ${file}`);
  }
  outStream.end();
  console.log(`Combined CSV written to: ${outputFile}`);

  // Remove originals if requested
  if (removeOriginals) {
    for (const file of certFiles) {
      fs.unlinkSync(file);
    }
    console.log('Original certificates.csv files deleted.');
  }
}

// If run directly, execute the combination
if (require.main === module) {
  combineEpcCertificates().catch(err => {
    console.error('Error combining EPC certificates:', err);
    process.exit(1);
  });
}

module.exports = { combineEpcCertificates }; 