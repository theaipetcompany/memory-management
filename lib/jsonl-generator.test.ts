import { generateJSONL, validateJSONL, ImageData } from '../lib/jsonl-generator';

// Mock the image validation module
jest.mock('../lib/image-validation', () => ({
  validateImageBuffer: jest.fn(),
  validateDatasetSize: jest.fn(),
  validateTrainingExample: jest.fn(),
  OPENAI_VISION_REQUIREMENTS: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedFormats: ['jpeg', 'png', 'webp'],
    allowedColorSpaces: ['srgb', 'rgb', 'rgba'],
    maxImagesPerExample: 64,
    maxExamplesPerFile: 50000,
  },
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

describe('JSONL Generator', () => {
  const mockImages: ImageData[] = [
    {
      id: '1',
      filename: 'test1.jpg',
      annotation: 'This is a test cheese',
      filePath: '/uploads/test1.jpg',
      mimeType: 'image/jpeg',
    },
    {
      id: '2',
      filename: 'test2.png',
      annotation: 'Another test cheese',
      filePath: '/uploads/test2.png',
      mimeType: 'image/png',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful image validation
    const { validateImageBuffer, validateDatasetSize, validateTrainingExample } = require('../lib/image-validation');
    validateImageBuffer.mockResolvedValue({
      isValid: true,
      errors: [],
      metadata: {
        width: 1000,
        height: 1000,
        format: 'jpeg',
        colorSpace: 'srgb',
        channels: 3,
        hasAlpha: false,
        size: 1024 * 1024,
      },
    });
    
    validateDatasetSize.mockReturnValue({
      isValid: true,
      errors: [],
    });
    
    validateTrainingExample.mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Mock file reading
    const { readFile } = require('fs/promises');
    readFile.mockResolvedValue(Buffer.from('mock image data'));
  });

  describe('generateJSONL', () => {
    it('should generate valid JSONL for valid images', async () => {
      const result = await generateJSONL(mockImages);

      expect(result.validExamples).toBe(2);
      expect(result.skippedImages).toHaveLength(0);
      expect(result.validationErrors).toHaveLength(0);
      expect(result.jsonl).toContain('This is a test cheese');
      expect(result.jsonl).toContain('Another test cheese');
    });

    it('should skip invalid images and report them', async () => {
      const { validateImageBuffer } = require('../lib/image-validation');
      validateImageBuffer
        .mockResolvedValueOnce({
          isValid: true,
          errors: [],
          metadata: { width: 1000, height: 1000, format: 'jpeg', colorSpace: 'srgb', channels: 3, hasAlpha: false, size: 1024 * 1024 },
        })
        .mockResolvedValueOnce({
          isValid: false,
          errors: ['Unsupported format'],
          metadata: undefined,
        });

      const result = await generateJSONL(mockImages);

      expect(result.validExamples).toBe(1);
      expect(result.skippedImages).toHaveLength(1);
      expect(result.skippedImages[0].filename).toBe('test2.png');
      expect(result.skippedImages[0].reason).toBe('Unsupported format');
    });

    it('should report dataset validation errors', async () => {
      const { validateDatasetSize } = require('../lib/image-validation');
      validateDatasetSize.mockReturnValue({
        isValid: false,
        errors: ['Dataset too large'],
      });

      const result = await generateJSONL(mockImages);

      expect(result.validationErrors).toContain('Dataset too large');
    });

    it('should handle file reading errors', async () => {
      const { readFile } = require('fs/promises');
      readFile.mockRejectedValue(new Error('File not found'));

      const result = await generateJSONL(mockImages);

      expect(result.validExamples).toBe(0);
      expect(result.skippedImages).toHaveLength(2);
      expect(result.skippedImages[0].reason).toContain('Processing error');
    });

    it('should generate correct JSONL structure', async () => {
      const result = await generateJSONL(mockImages.slice(0, 1));

      const lines = result.jsonl.split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.messages).toHaveLength(3);
      expect(parsed.messages[0].role).toBe('system');
      expect(parsed.messages[1].role).toBe('user');
      expect(parsed.messages[2].role).toBe('assistant');
      expect(parsed.messages[1].content[0].type).toBe('image_url');
      expect(parsed.messages[2].content[0].type).toBe('text');
      expect(parsed.messages[2].content[0].text).toBe('This is a test cheese');
    });
  });

  describe('validateJSONL', () => {
    it('should validate correct JSONL format', () => {
      const validJSONL = JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,test' } }],
          },
          {
            role: 'assistant',
            content: [{ type: 'text', text: 'Test annotation' }],
          },
        ],
      });

      const result = validateJSONL(validJSONL);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty JSONL', () => {
      const result = validateJSONL('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('JSONL file is empty');
    });

    it('should reject invalid JSON', () => {
      const result = validateJSONL('invalid json');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Line 1: Invalid JSON - SyntaxError: Unexpected token \'i\', "invalid json" is not valid JSON');
    });

    it('should reject missing messages array', () => {
      const invalidJSONL = JSON.stringify({});

      const result = validateJSONL(invalidJSONL);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Line 1: Missing or invalid \'messages\' array');
    });

    it('should reject wrong number of messages', () => {
      const invalidJSONL = JSON.stringify({
        messages: [
          { role: 'user', content: [{ type: 'image_url', image_url: { url: 'test' } }] },
        ],
      });

      const result = validateJSONL(invalidJSONL);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Line 1: Expected exactly 2 messages (user and assistant)');
    });

    it('should reject wrong message roles', () => {
      const invalidJSONL = JSON.stringify({
        messages: [
          { role: 'assistant', content: [{ type: 'image_url', image_url: { url: 'test' } }] },
          { role: 'user', content: [{ type: 'text', text: 'test' }] },
        ],
      });

      const result = validateJSONL(invalidJSONL);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Line 1: First message must have role \'user\'');
    });

    it('should reject missing image content', () => {
      const invalidJSONL = JSON.stringify({
        messages: [
          { role: 'user', content: [{ type: 'text', text: 'test' }] },
          { role: 'assistant', content: [{ type: 'text', text: 'test' }] },
        ],
      });

      const result = validateJSONL(invalidJSONL);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Line 1: User message missing image content');
    });

    it('should reject missing text content', () => {
      const invalidJSONL = JSON.stringify({
        messages: [
          { role: 'user', content: [{ type: 'image_url', image_url: { url: 'test' } }] },
          { role: 'assistant', content: [{ type: 'image_url', image_url: { url: 'test' } }] },
        ],
      });

      const result = validateJSONL(invalidJSONL);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Line 1: Assistant message missing text content');
    });
  });
});
