const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();

// 1. Log that we are starting
console.log('🚀 Optimized Server Starting...');

// 2. Enable gzip compression for all responses
app.use(compression());

// 3. Serve static files with caching headers
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Don't cache HTML files as aggressively
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
        }
    }
}));

// 4. Handle standard API health check (so cPanel knows we are alive)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Mirhal is live!' });
});

// 5. IMPORTANT: Send all other traffic to the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// 6. Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📦 Compression enabled`);
    console.log(`⚡ Caching optimized`);
});
