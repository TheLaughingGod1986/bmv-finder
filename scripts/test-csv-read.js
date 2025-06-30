const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('pp-complete.csv'),
  crlfDelay: Infinity
});

let count = 0;
let isFirstLine = true;

rl.on('line', (line) => {
  if (isFirstLine) {
    isFirstLine = false;
    return;
  }
  if (count < 5) {
    console.log(line);
    count++;
  } else {
    rl.close();
  }
});

rl.on('close', () => {
  console.log('Done reading 5 lines.');
}); 