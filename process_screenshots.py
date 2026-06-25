
import os
from PIL import Image

# Target Dimensions (iPad Pro 12.9" Landscape)
TARGET_WIDTH = 2732
TARGET_HEIGHT = 2048

# Source Images (from conversation metadata)
source_images = [
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_0_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_1_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_2_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_3_1768410436119.png",
    "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9/uploaded_image_4_1768410436119.png"
]

output_dir = "/Users/aziz/.gemini/antigravity/brain/24699c12-fba1-4c89-81b5-e57d21444fc9"

print(f"Processing {len(source_images)} images...")

for i, img_path in enumerate(source_images):
    try:
        if not os.path.exists(img_path):
            print(f"Skipping missing file: {img_path}")
            continue
            
        with Image.open(img_path) as img:
            # Convert to RGB if needed (remove alpha if present, though PNG usually keeps it)
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            # Resize
            # We use distinct resize to force exact dimensions. 
            # Since source is likely iPad, aspect ratio distortion should be minimal.
            resized_img = img.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
            
            output_filename = f"AppStore_Screenshot_{i+1}.jpg"
            output_path = os.path.join(output_dir, output_filename)
            
            # Save as High Quality JPEG
            resized_img.save(output_path, "JPEG", quality=95)
            print(f"Saved: {output_path} ({TARGET_WIDTH}x{TARGET_HEIGHT})")
            
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

print("Done.")
