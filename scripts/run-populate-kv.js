require('dotenv').config({ path: '.env', debug: true });

console.log('--- Debugging Environment Variables ---');
console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL);
console.log('UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN);
console.log('------------------------------------');

require('ts-node').register({
  project: './scripts/tsconfig.json'
});
require('./populate-kv.ts'); 