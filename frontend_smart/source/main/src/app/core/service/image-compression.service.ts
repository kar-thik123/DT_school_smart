import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';
import { Options as CompressionOptions } from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {

  constructor() { }

  /**
   * Compress an image file using browser-image-compression.
   * If the file is smaller than the maxSizeMB, or if compression fails, 
   * it will fall back to returning the original file.
   *
   * @param file - The image file to compress
   * @param options - Compression options overrides
   * @returns A promise resolving to the compressed file or original file on error
   */
  async compressImage(
    file: File, 
    options?: Partial<CompressionOptions>
  ): Promise<File> {
    
    // Default configuration for compression
    const defaultOptions: CompressionOptions = {
      maxSizeMB: 1, // Target max size in MB
      maxWidthOrHeight: 1920, // Max dimension
      useWebWorker: true,
      initialQuality: 0.8,
      ...options
    };

    console.log(`[ImageCompression] Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    try {
      // Execute the compression
      const compressedBlob = await imageCompression(file, defaultOptions);
      
      // Convert Blob to File to maintain file name and type consistency
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
        lastModified: Date.now(),
      });
      
      console.log(`[ImageCompression] Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      return compressedFile;
    } catch (error) {
      console.error('[ImageCompression] Compression error, falling back to original file.', error);
      // Fallback to original file in case of any error
      return file;
    }
  }
}
