// Generate bcrypt password hash for seed data
// Usage: node scripts/generate-hash.js <password>

const bcrypt = require('bcrypt-edge');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-hash.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nCopy this hash to sql/seed.sql');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
