// Simple password hash generator using built-in crypto
// For development/demo purposes only

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-hash-simple.js <password>');
  process.exit(1);
}

// Generate a simple but secure hash for demo purposes
// In production, use proper bcrypt
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
const fullHash = `${salt}:${hash}`;

console.log('Password:', password);
console.log('Hash:', fullHash);
console.log('\nNOTE: This is a pbkdf2 hash. For production with bcrypt-edge,');
console.log('you may need to use a different method.');
