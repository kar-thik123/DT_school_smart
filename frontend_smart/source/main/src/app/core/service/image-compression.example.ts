import { Component, inject } from '@angular/core';
import { ImageCompressionService } from './image-compression.service';

/**
 * Example usage of ImageCompressionService.
 * This is provided for documentation purposes.
 */
@Component({
  selector: 'app-image-compression-example',
  template: `
    <input type="file" (change)="onProfileImageSelected($event)" accept="image/*" />
    <input type="file" (change)="onMultipleImagesSelected($event)" accept="image/*" multiple />
  `
})
export class ImageCompressionExampleComponent {
  
  private imageCompressionService = inject(ImageCompressionService);

  /**
   * 1. Profile Image Upload Example
   */
  async onProfileImageSelected(event: any) {
    const file = event.target.files[0] as File;
    if (!file) return;

    try {
      // Compress for profile image: 1MB max, 800x800 max
      const compressedFile = await this.imageCompressionService.compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        initialQuality: 0.8
      });

      console.log('Profile image compressed:', compressedFile);
      // Proceed to upload compressedFile...
    } catch (error) {
      console.error('Compression failed', error);
    }
  }

  /**
   * 2. Question Bank Image Upload Example
   */
  async onQuestionImageSelected(event: any) {
    const file = event.target.files[0] as File;
    if (!file) return;

    try {
      // Compress for question image: higher quality, larger max size
      const compressedFile = await this.imageCompressionService.compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1200,
        initialQuality: 0.9
      });

      console.log('Question image compressed:', compressedFile);
      // Proceed to upload compressedFile...
    } catch (error) {
      console.error('Compression failed', error);
    }
  }

  /**
   * 3. Multiple Image Upload Example
   */
  async onMultipleImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (!files.length) return;

    try {
      // Process all files in parallel
      const compressionPromises = files.map(file => 
        this.imageCompressionService.compressImage(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1024
        })
      );

      const compressedFiles = await Promise.all(compressionPromises);
      console.log('Multiple images compressed:', compressedFiles);
      // Proceed to upload compressedFiles array...
    } catch (error) {
      console.error('Batch compression failed', error);
    }
  }
}
