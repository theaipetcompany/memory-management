import sharp from 'sharp';

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    colorSpace: string;
    channels: number;
    hasAlpha: boolean;
    size: number;
  };
}

export interface ImageRequirements {
  maxSizeBytes: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats: string[];
  allowedColorSpaces: string[];
  maxImagesPerExample: number;
  maxExamplesPerFile: number;
}

export const OPENAI_VISION_REQUIREMENTS: ImageRequirements = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['jpeg', 'png', 'webp'],
  allowedColorSpaces: ['srgb', 'rgb', 'rgba'],
  maxImagesPerExample: 64,
  maxExamplesPerFile: 50000,
};

export async function validateImageFile(
  file: File,
  requirements: ImageRequirements = OPENAI_VISION_REQUIREMENTS
): Promise<ImageValidationResult> {
  const errors: string[] = [];

  try {
    // Basic file validation
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
      return { isValid: false, errors };
    }

    // Check file size
    if (file.size > requirements.maxSizeBytes) {
      errors.push(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(requirements.maxSizeBytes / 1024 / 1024).toFixed(0)}MB`
      );
    }

    // Convert File to Buffer for sharp processing
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Get image metadata using sharp
    const metadata = await sharp(buffer).metadata();
    
    // Validate format
    if (!metadata.format || !requirements.allowedFormats.includes(metadata.format)) {
      errors.push(
        `Image format '${metadata.format}' is not supported. Allowed formats: ${requirements.allowedFormats.join(', ')}`
      );
    }

    // Validate color space
    if (metadata.space && !requirements.allowedColorSpaces.includes(metadata.space)) {
      errors.push(
        `Image color space '${metadata.space}' is not supported. Allowed color spaces: ${requirements.allowedColorSpaces.join(', ')}`
      );
    }

    // Validate dimensions (if specified)
    if (requirements.maxWidth && metadata.width && metadata.width > requirements.maxWidth) {
      errors.push(`Image width ${metadata.width}px exceeds maximum ${requirements.maxWidth}px`);
    }

    if (requirements.maxHeight && metadata.height && metadata.height > requirements.maxHeight) {
      errors.push(`Image height ${metadata.height}px exceeds maximum ${requirements.maxHeight}px`);
    }

    // Check for problematic content patterns (basic checks)
    const contentWarnings = await checkContentModeration(buffer);
    if (contentWarnings.length > 0) {
      errors.push(...contentWarnings);
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      metadata: isValid ? {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        colorSpace: metadata.space || 'unknown',
        channels: metadata.channels || 0,
        hasAlpha: metadata.hasAlpha || false,
        size: file.size,
      } : undefined,
    };

  } catch (error) {
    errors.push(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors };
  }
}

export async function validateImageBuffer(
  buffer: Buffer,
  requirements: ImageRequirements = OPENAI_VISION_REQUIREMENTS
): Promise<ImageValidationResult> {
  const errors: string[] = [];

  try {
    // Get image metadata using sharp
    const metadata = await sharp(buffer).metadata();
    
    // Validate format
    if (!metadata.format || !requirements.allowedFormats.includes(metadata.format)) {
      errors.push(
        `Image format '${metadata.format}' is not supported. Allowed formats: ${requirements.allowedFormats.join(', ')}`
      );
    }

    // Validate color space
    if (metadata.space && !requirements.allowedColorSpaces.includes(metadata.space)) {
      errors.push(
        `Image color space '${metadata.space}' is not supported. Allowed color spaces: ${requirements.allowedColorSpaces.join(', ')}`
      );
    }

    // Validate dimensions (if specified)
    if (requirements.maxWidth && metadata.width && metadata.width > requirements.maxWidth) {
      errors.push(`Image width ${metadata.width}px exceeds maximum ${requirements.maxWidth}px`);
    }

    if (requirements.maxHeight && metadata.height && metadata.height > requirements.maxHeight) {
      errors.push(`Image height ${metadata.height}px exceeds maximum ${requirements.maxHeight}px`);
    }

    // Check file size
    if (buffer.length > requirements.maxSizeBytes) {
      errors.push(
        `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(requirements.maxSizeBytes / 1024 / 1024).toFixed(0)}MB`
      );
    }

    // Check for problematic content patterns (basic checks)
    const contentWarnings = await checkContentModeration(buffer);
    if (contentWarnings.length > 0) {
      errors.push(...contentWarnings);
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      metadata: isValid ? {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        colorSpace: metadata.space || 'unknown',
        channels: metadata.channels || 0,
        hasAlpha: metadata.hasAlpha || false,
        size: buffer.length,
      } : undefined,
    };

  } catch (error) {
    errors.push(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors };
  }
}

async function checkContentModeration(buffer: Buffer): Promise<string[]> {
  const warnings: string[] = [];
  
  try {
    // Basic content moderation checks
    // Note: This is a simplified implementation. In production, you'd want to use
    // a proper content moderation service like OpenAI's content moderation API
    
    // Check for common patterns that might indicate faces or people
    // This is a basic heuristic - for production use, integrate with proper moderation services
    
    // For now, we'll do basic file analysis
    const metadata = await sharp(buffer).metadata();
    
    // Check if image is too small (might be a CAPTCHA or icon)
    if (metadata.width && metadata.height && (metadata.width < 50 || metadata.height < 50)) {
      warnings.push('Image is very small and might not be suitable for training');
    }
    
    // Check if image is extremely large (might indicate it's not a typical training image)
    if (metadata.width && metadata.height && (metadata.width > 4000 || metadata.height > 4000)) {
      warnings.push('Image is very large and might not be suitable for training');
    }
    
    // Additional checks could be added here for:
    // - Face detection using computer vision libraries
    // - Text detection (CAPTCHA detection)
    // - Content classification
    
  } catch (error) {
    // If content moderation fails, we'll log it but not block the image
    console.warn('Content moderation check failed:', error);
  }
  
  return warnings;
}

export function validateDatasetSize(
  imageCount: number,
  requirements: ImageRequirements = OPENAI_VISION_REQUIREMENTS
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (imageCount > requirements.maxExamplesPerFile) {
    errors.push(
      `Dataset contains ${imageCount} images, which exceeds the maximum of ${requirements.maxExamplesPerFile} images per training file`
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateTrainingExample(
  imageCount: number,
  requirements: ImageRequirements = OPENAI_VISION_REQUIREMENTS
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (imageCount > requirements.maxImagesPerExample) {
    errors.push(
      `Training example contains ${imageCount} images, which exceeds the maximum of ${requirements.maxImagesPerExample} images per example`
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
