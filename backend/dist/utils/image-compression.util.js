"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
/**
 * Reusable utility to process, compress and resize images using sharp.
 *
 * @param fileBuffer - The original image buffer (e.g. from multer)
 * @param originalName - The original filename to extract extension if needed
 * @param options - Options for processing
 * @returns The final filename (or path) and optimization details
 */
const processImage = async (fileBuffer, originalName, options) => {
    const { width, height, quality = 80, format = 'webp', outputDirectory, skipIfSmall = false, originalSizeLimit = 100 * 1024 // 100 KB
     } = options;
    const originalSize = fileBuffer.length;
    console.log(`[ImageCompressionUtil] Original Size: ${(originalSize / 1024).toFixed(2)} KB`);
    // Generate unique filename
    const uniqueId = crypto_1.default.randomUUID();
    const filename = `${uniqueId}.${format}`;
    const filePath = path_1.default.join(outputDirectory, filename);
    // Ensure output directory exists
    if (!fs_1.default.existsSync(outputDirectory)) {
        fs_1.default.mkdirSync(outputDirectory, { recursive: true });
    }
    // If skipping compression for small images and no resize/format is strictly required
    if (skipIfSmall && originalSize < originalSizeLimit && !width && !height) {
        const ext = path_1.default.extname(originalName) || `.${format}`;
        const skipFilename = `${uniqueId}${ext}`;
        const skipFilePath = path_1.default.join(outputDirectory, skipFilename);
        fs_1.default.writeFileSync(skipFilePath, fileBuffer);
        console.log(`[ImageCompressionUtil] Skipped compression. Final Size: ${(originalSize / 1024).toFixed(2)} KB`);
        return {
            filePath: skipFilePath,
            filename: skipFilename,
            size: originalSize
        };
    }
    // Sharp processing pipeline
    let sharpInstance = (0, sharp_1.default)(fileBuffer);
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
    }
    else if (format === 'jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
    }
    else if (format === 'png') {
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
exports.processImage = processImage;
