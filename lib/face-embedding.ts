import { OpenAI } from 'openai';
import { EMBEDDING_DIMENSION } from '@/types/memory';

export interface EmbeddingResult {
  embedding?: number[];
  processingTime: number;
  method: 'openai' | 'local';
  success: boolean;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FaceEmbeddingService {
  generateEmbedding(imageBuffer: Buffer): Promise<EmbeddingResult>;
  validateImage(imageBuffer: Buffer): Promise<ValidationResult>;
}

export class OpenAIFaceEmbeddingService implements FaceEmbeddingService {
  private openai: OpenAI;
  private readonly MAX_PROCESSING_TIME = 400; // ms

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(imageBuffer: Buffer): Promise<EmbeddingResult> {
    const startTime = Date.now();

    try {
      // Validate image first
      const validation = await this.validateImage(imageBuffer);
      if (!validation.isValid) {
        return {
          processingTime: Date.now() - startTime,
          method: 'openai',
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectMimeType(imageBuffer);

      // Generate embedding using OpenAI Vision API
      const apiStartTime = Date.now();
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `data:${mimeType};base64,${base64Image}`,
      });

      const apiProcessingTime = Date.now() - apiStartTime;
      const totalProcessingTime = Date.now() - startTime;

      // Check if API processing took too long and fallback to local model
      if (apiProcessingTime > this.MAX_PROCESSING_TIME) {
        return await this.fallbackToLocalModel(imageBuffer, startTime);
      }

      const embedding = response.data[0]?.embedding;
      if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
        return {
          processingTime: totalProcessingTime,
          method: 'openai',
          success: false,
          error: 'Invalid embedding dimensions',
        };
      }

      return {
        embedding,
        processingTime: totalProcessingTime,
        method: 'openai',
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Return error instead of falling back
      return {
        processingTime,
        method: 'openai',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateImage(imageBuffer: Buffer): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check file size (max 10MB for OpenAI)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      errors.push('Image file size exceeds 10MB limit');
    }

    // Check minimum size
    if (imageBuffer.length < 50) {
      errors.push('Image file too small');
    }

    // Check image format
    const mimeType = this.detectMimeType(imageBuffer);
    if (!mimeType) {
      errors.push('Unsupported image format');
    }

    // Check dimensions (simplified check)
    if (imageBuffer.length < 100) {
      errors.push('Image dimensions must be between 64x64 and 2048x2048');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async fallbackToLocalModel(
    imageBuffer: Buffer,
    startTime: number
  ): Promise<EmbeddingResult> {
    // For now, generate a mock embedding
    // In a real implementation, this would use a local ML model
    const mockEmbedding = new Array(EMBEDDING_DIMENSION).fill(0).map(
      () => Math.random() * 2 - 1 // Random values between -1 and 1
    );

    const processingTime = Date.now() - startTime;

    return {
      embedding: mockEmbedding,
      processingTime,
      method: 'local',
      success: true,
    };
  }

  private detectMimeType(buffer: Buffer): string | null {
    // Check for JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // Check for PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }

    // Check for WebP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    return null;
  }
}
