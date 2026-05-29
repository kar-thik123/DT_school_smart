import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'png';
  outputDirectory: string; // Absolute or relative path where image will be saved
  skipIfSmall?: boolean; // Skip compression if size < 100kb
  originalSizeLimit?: number; // threshold in bytes for skipIfSmall, default 100kb
}

/**
 * Reusable utility to process, compress and resize images using sharp.
 * 
 * @param fileBuffer - The original image buffer (e.g. from multer)
 * @param originalName - The original filename to extract extension if needed
 * @param options - Options for processing
 * @returns The final filename (or path) and optimization details
 */
export const processImage = async (
  fileBuffer: Buffer, 
  originalName: string, 
  options: ImageProcessingOptions
): Promise<{ filePath: string, filename: string, size: number }> => {
  
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    outputDirectory,
    skipIfSmall = false,
    originalSizeLimit = 100 * 1024 // 100 KB
  } = options;

  const originalSize = fileBuffer.length;
  console.log(`[ImageCompressionUtil] Original Size: ${(originalSize / 1024).toFixed(2)} KB`);

  // Generate unique filename
  const uniqueId = uuidv4();
  const filename = `${uniqueId}.${format}`;
  const filePath = path.join(outputDirectory, filename);

  // Ensure output directory exists
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  // If skipping compression for small images and no resize/format is strictly required
  if (skipIfSmall && originalSize < originalSizeLimit && !width && !height) {
    const ext = path.extname(originalName) || `.${format}`;
    const skipFilename = `${uniqueId}${ext}`;
    const skipFilePath = path.join(outputDirectory, skipFilename);
    
    fs.writeFileSync(skipFilePath, fileBuffer);
    console.log(`[ImageCompressionUtil] Skipped compression. Final Size: ${(originalSize / 1024).toFixed(2)} KB`);
    
    return {
      filePath: skipFilePath,
      filename: skipFilename,
      size: originalSize
    };
  }

  // Sharp processing pipeline
  let sharpInstance = sharp(fileBuffer);

  if (width || height) {
    sharpInstance = sharpInstance.resize({
      width,
      height,
      fit: 'inside', // Maintain aspect ratio
      withoutEnlargement: true // Don't upscale smaller images
    });
  }

  if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  } else if (format === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    sharpInstance = sharpInstance.png({ quality });
  }

  const info = await sharpInstance.toFile(filePath);
  console.log(`[ImageCompressionUtil] Compressed Size: ${(info.size / 1024).toFixed(2)} KB`);

  return {
    filePath,
    filename,
    size: info.size
  };
};
