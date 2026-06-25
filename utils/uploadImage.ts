import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

interface UploadProgress {
    progress: number;
    url?: string;
    error?: string;
}

/**
 * Compress an image before uploading
 * Reduces file size while maintaining quality
 */
const compressImage = async (file: File): Promise<File> => {
    const options = {
        maxSizeMB: 1, // Max size 1MB after compression
        maxWidthOrHeight: 1920, // Max dimension 1920px  
        useWebWorker: true,
        fileType: 'image/jpeg', // Convert to JPEG for better compression
    };

    try {
        const compressedFile = await imageCompression(file, options);
        console.log(`✅ Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        return compressedFile;
    } catch (error) {
        console.error('Compression failed, using original:', error);
        return file; // Fallback to original if compression fails
    }
};

/**
 * Upload an image to Supabase Storage with automatic compression
 * @param file The file to upload
 * @param folder The folder path (e.g., 'spots', 'reviews')
 * @param userId The user's ID for organizing files
 * @param onProgress Callback for upload progress updates
 * @returns Promise with the download URL
 */
export const uploadImage = async (
    file: File,
    folder: string,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        // Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB before compression
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            reject(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
            return;
        }

        if (file.size > maxSize) {
            reject(new Error('File too large. Maximum size is 10MB.'));
            return;
        }

        try {
            // Compress image before uploading
            const compressedFile = await compressImage(file);

            // Generate unique filename
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const filename = `${timestamp}_${random}.jpg`; // Always JPG after compression
            const storagePath = `${folder}/${userId}/${filename}`;

            // Upload to Supabase 'images' bucket
            const { data, error } = await supabase.storage
                .from('images')
                .upload(storagePath, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Upload error:', error);
                reject(new Error(`Upload failed: ${error.message}`));
                return;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(storagePath);

            resolve(publicUrl);

        } catch (error: any) {
            reject(new Error(`Compression or upload failed: ${error.message}`));
        }
    });
};

/**
 * Upload multiple images
 * @param files Array of files to upload
 * @param folder The folder path
 * @param userId The user's ID
 * @param onProgress Callback for overall progress
 * @returns Promise with array of download URLs
 */
export const uploadMultipleImages = async (
    files: File[],
    folder: string,
    userId: string,
    onProgress?: (overallProgress: number, currentFile: number, totalFiles: number) => void
): Promise<string[]> => {
    const urls: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const url = await uploadImage(file, folder, userId, (fileProgress) => {
                if (onProgress) {
                    // Calculate overall progress
                    const completedFiles = i;
                    const currentFileProgress = fileProgress / 100;
                    const overallProgress = ((completedFiles + currentFileProgress) / totalFiles) * 100;
                    onProgress(overallProgress, i + 1, totalFiles);
                }
            });
            urls.push(url);
        } catch (error: any) {
            console.error(`Failed to upload file ${i + 1}:`, error);
            throw error;
        }
    }

    return urls;
};
