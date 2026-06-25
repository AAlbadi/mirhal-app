
let Jimp = require('jimp');
if (Jimp.Jimp) Jimp = Jimp.Jimp;

const path = require('path');
const fs = require('fs');

const TARGET_WIDTH = 2732;
const TARGET_HEIGHT = 2048;

const sourceImages = [
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_0_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_1_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_2_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_3_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_4_1768410436119.png"
];

const outputDir = "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9";

async function processImages() {
    console.log(`Processing ${sourceImages.length} images...`);

    for (let i = 0; i < sourceImages.length; i++) {
        const imgPath = sourceImages[i];
        if (!fs.existsSync(imgPath)) {
            console.log(`Skipping missing file: ${imgPath}`);
            continue;
        }

        try {
            const image = await Jimp.read(imgPath);

            // Resize to cover the target dimensions (crops if necessary to maintain aspect ratio)
            // or use resize(w, h) to stretch.
            // Given screenshots, resize is usually safer if aspect ratio is close.
            // Let's use resize to force exact dimensions as requested.
            image.resize(TARGET_WIDTH, TARGET_HEIGHT);

            const outputFilename = `AppStore_Screenshot_${i + 1}.jpg`;
            const outputPath = path.join(outputDir, outputFilename);

            await image.quality(95).writeAsync(outputPath);
            console.log(`Saved: ${outputPath}`);

        } catch (err) {
            console.error(`Error processing ${imgPath}:`, err);
        }
    }
}

processImages().then(() => console.log('Done.')).catch(console.error);
