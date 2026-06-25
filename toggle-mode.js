const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'capacitor.config.ts');
const mode = process.argv[2]; // 'local' or 'live'

if (!['local', 'live'].includes(mode)) {
    console.error('Usage: node toggle-mode.js <local|live>');
    process.exit(1);
}

let content = fs.readFileSync(configPath, 'utf8');

if (mode === 'live') {
    // Add or uncomment server block
    if (!content.includes('server: {')) {
        const replacement = `  webDir: 'dist',
  server: {
    url: 'https://mirhal.app',
    cleartext: false,
  },`;
        content = content.replace("  webDir: 'dist',", replacement);
    } else {
        console.log('Already in live mode (or similar). Please check file manually if unsure.');
    }
    console.log('✅ Switched to LIVE mode (pointing to mirhal.app)');
    console.log('⚠️  REMINDER: You must DEPLOY your changes to cPanel for them to appear!');
} else {
    // Remove server block to use local dist
    // We regex replace the server block
    content = content.replace(/  server: {[\s\S]*?},\n/g, '');
    console.log('✅ Switched to LOCAL mode (using local dist folder)');
    console.log('ℹ️  Run "npx cap sync ios" to apply.');
}

fs.writeFileSync(configPath, content);
