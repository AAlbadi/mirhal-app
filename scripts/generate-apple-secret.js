const jwt = require('jsonwebtoken');
const fs = require('fs');

// Usage: node scripts/generate-apple-secret.js <TeamID> <KeyID> <PathToPrivateKey.p8> <BundleID>

const args = process.argv.slice(2);

if (args.length < 4) {
    console.log("Usage: node scripts/generate-apple-secret.js <TeamID> <KeyID> <PathToPrivateKey.p8> <BundleID>");
    process.exit(1);
}

const teamId = args[0];
const keyId = args[1];
const privateKeyPath = args[2];
const bundleId = args[3];
const privateKey = fs.readFileSync(privateKeyPath);

const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d', // 6 months (Max allowed by Apple)
    audience: 'https://appleid.apple.com',
    issuer: teamId,
    subject: bundleId, // Your Bundle ID
    keyid: keyId,
});

console.log("\n✅ YOUR APPLE SECRET KEY (Copy this to Supabase):\n");
console.log(token);
console.log("\n⚠️ NOTE: This key expires in 6 months. You will need to regenerate it then.\n");
