const fs = require('fs');
const path = require('path');

/**
 * Manual .env file loader for cPanel environments
 * This bypasses issues with cPanel's environment variables interface
 */
function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, '.env');

        if (!fs.existsSync(envPath)) {
            console.warn('⚠️ .env file not found at:', envPath);
            return;
        }

        const envFile = fs.readFileSync(envPath, 'utf8');
        const lines = envFile.split('\n');

        lines.forEach((line) => {
            // Skip empty lines and comments
            if (!line || line.trim().startsWith('#')) return;

            // Parse KEY=VALUE format
            const match = line.match(/^\s*([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();

                // Only set if not already in process.env
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });

        console.log('✅ Environment variables loaded from .env file');
    } catch (error) {
        console.error('❌ Error loading .env file:', error.message);
    }
}

module.exports = { loadEnvFile };
