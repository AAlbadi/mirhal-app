const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

async function verifySheets() {
    console.log('🔍 Starting Google Sheets Verification...');

    // 1. Load Credentials
    const credentialsPath = path.join(__dirname, '../mirhal-sync-453bf2d91a49.json');
    if (!fs.existsSync(credentialsPath)) {
        console.error('❌ Service Account Key file not found at:', credentialsPath);
        return;
    }

    const creds = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log(`👤 Using Service Account: ${creds.client_email}`);

    // 2. Define Sheets to Test
    const sheets = [
        { name: 'Reviews', id: '1SC0qC-Cp21_SNnOYkqEbym3MVRF_hqbMFDMs9gt1Pk4', required: ['Review ID', 'Status'] },
        { name: 'Spots (Campsites)', id: '1rsjJgYTYzC0HS4qnEaji8k0OM272pdM6gSWHHLFuQD8', required: ['Name', 'Latitude', 'Longitude'] },
        { name: 'Trails', id: '1MVGXhqc0sBGxwQpkvDFP49noVvszEIvB46O0glAkHi4', required: ['Name', 'Location', 'Difficulty'] }
    ];

    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // 3. Check Each Sheet
    for (const sheetInfo of sheets) {
        console.log(`\n-----------------------------------`);
        console.log(`📊 Checking ${sheetInfo.name} Sheet...`);
        console.log(`🆔 ID: ${sheetInfo.id}`);

        try {
            const doc = new GoogleSpreadsheet(sheetInfo.id, serviceAccountAuth);
            await doc.loadInfo();
            console.log(`✅ Access Granted! Title: "${doc.title}"`);

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();
            const headers = sheet.headerValues;
            console.log(`📝 Headers Found: [${headers.join(', ')}]`);

            // Verify Required Headers
            const missing = sheetInfo.required.filter(h => !headers.includes(h));
            if (missing.length > 0) {
                console.error(`❌ HEADER ERROR: Missing required columns: ${missing.join(', ')}`);
                console.error(`   Expected one of: ${sheetInfo.required.join(', ')}`);
            } else {
                console.log(`✅ Headers look correct.`);

                // CHECK ROWS
                const rows = await sheet.getRows();
                console.log(`📊 Total Data Rows: ${rows.length}`);

                if (rows.length > 0) {
                    const firstRow = rows[0];
                    console.log(`   First Row Sample:`);

                    if (sheetInfo.name.includes('Spots')) {
                        console.log(`   - Name: ${firstRow.get('Name')}`);
                        console.log(`   - Lat: ${firstRow.get('Latitude')} | Lng: ${firstRow.get('Longitude')}`);
                    } else if (sheetInfo.name.includes('Reviews')) {
                        console.log(`   - Status: ${firstRow.get('Status')} | ID: ${firstRow.get('Review ID')}`);
                    } else {
                        console.log(`   - Name: ${firstRow.get('Name')}`);
                    }
                } else {
                    console.warn(`⚠️ Warning: This sheet appears to be empty (no data rows). Sync will do nothing.`);
                }
            }

        } catch (error) {
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                console.error(`❌ PERMISSION DENIED: The service account cannot access this sheet.`);
                console.error(`   ACTION: Share this sheet with "${creds.client_email}" as Editor.`);
            } else if (error.response && error.response.status === 404) {
                console.error(`❌ NOT FOUND: The Sheet ID is incorrect or the sheet was deleted.`);
            } else {
                console.error(`❌ ERROR: ${error.message}`);
            }
        }
    }
    console.log(`\n-----------------------------------`);
    console.log('Done.');
}

verifySheets();
