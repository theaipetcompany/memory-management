import { validateImageFile, validateImageBuffer, validateDatasetSize, validateTrainingExample, OPENAI_VISION_REQUIREMENTS } from '../lib/image-validation';

// Mock sharp for testing
jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockImplementation((buffer) => ({
    metadata: jest.fn().mockResolvedValue({
      width: 1000,
      height: 1000,
      format: 'jpeg',
      space: 'srgb',
      channels: 3,
      hasAlpha: false,
    }),
  }));
  return mockSharp;
});

describe('Image Validation', () => {
  beforeEach(() => {
    // Reset sharp mock for each test
    const sharp = require('sharp');
    sharp.mockImplementation(() => ({
      metadata: jest.fn().mockResolvedValue({
        width: 1000,
        height: 1000,
        format: 'jpeg',
        space: 'srgb',
        channels: 3,
        hasAlpha: false,
      }),
    }));
  });

  describe('validateImageFile', () => {
    it('should validate a valid JPEG image', async () => {
      const mockFile = {
        type: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      } as unknown as File;

      const result = await validateImageFile(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
    });

    it('should reject unsupported formats', async () => {
      const mockFile = {
        type: 'image/gif',
        size: 1024 * 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      } as unknown as File;

      // Mock sharp to return unsupported format
      const sharp = require('sharp');
      sharp.mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          width: 1000,
          height: 1000,
          format: 'gif',
          space: 'srgb',
          channels: 3,
          hasAlpha: false,
        }),
      }));

      const result = await validateImageFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image format \'gif\' is not supported. Allowed formats: jpeg, png, webp');
    });

    it('should reject files that are too large', async () => {
      const mockFile = {
        type: 'image/jpeg',
        size: 11 * 1024 * 1024, // 11MB
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      } as unknown as File;

      const result = await validateImageFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size 11.00MB exceeds maximum 10MB');
    });

    it('should reject unsupported color spaces', async () => {
      const mockFile = {
        type: 'image/jpeg',
        size: 1024 * 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      } as unknown as File;

      // Mock sharp to return unsupported color space
      const sharp = require('sharp');
      sharp.mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          width: 1000,
          height: 1000,
          format: 'jpeg',
          space: 'cmyk',
          channels: 4,
          hasAlpha: false,
        }),
      }));

      const result = await validateImageFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image color space \'cmyk\' is not supported. Allowed color spaces: srgb, rgb, rgba');
    });
  });

  describe('validateImageBuffer', () => {
    it('should validate a valid image buffer', async () => {
      const buffer = Buffer.from('test image data');

      const result = await validateImageBuffer(buffer);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      const buffer = Buffer.from('invalid image data');

      // Mock sharp to throw an error
      const sharp = require('sharp');
      sharp.mockImplementation(() => ({
        metadata: jest.fn().mockRejectedValue(new Error('Invalid image format')),
      }));

      const result = await validateImageBuffer(buffer);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to process image: Invalid image format');
    });
  });

  describe('validateDatasetSize', () => {
    it('should accept datasets within the limit', () => {
      const result = validateDatasetSize(1000);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject datasets that are too large', () => {
      const result = validateDatasetSize(60000);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dataset contains 60000 images, which exceeds the maximum of 50000 images per training file');
    });
  });

  describe('validateTrainingExample', () => {
    it('should accept examples within the limit', () => {
      const result = validateTrainingExample(10);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject examples with too many images', () => {
      const result = validateTrainingExample(100);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Training example contains 100 images, which exceeds the maximum of 64 images per example');
    });
  });

  describe('OPENAI_VISION_REQUIREMENTS', () => {
    it('should have correct requirements', () => {
      expect(OPENAI_VISION_REQUIREMENTS.maxSizeBytes).toBe(10 * 1024 * 1024);
      expect(OPENAI_VISION_REQUIREMENTS.allowedFormats).toEqual(['jpeg', 'png', 'webp']);
      expect(OPENAI_VISION_REQUIREMENTS.allowedColorSpaces).toEqual(['srgb', 'rgb', 'rgba']);
      expect(OPENAI_VISION_REQUIREMENTS.maxImagesPerExample).toBe(64);
      expect(OPENAI_VISION_REQUIREMENTS.maxExamplesPerFile).toBe(50000);
    });
  });
});
