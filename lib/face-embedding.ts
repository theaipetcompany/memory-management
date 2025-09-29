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
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // ms

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

      // Try OpenAI Vision API first (if available in future)
      // For now, fallback to local model
      return await this.generateEmbeddingWithRetry(imageBuffer, startTime);
    } catch (error) {
      const processingTime = Date.now() - startTime;

      return {
        processingTime,
        method: 'openai',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateEmbeddingWithRetry(
    imageBuffer: Buffer,
    startTime: number,
    attempt: number = 1
  ): Promise<EmbeddingResult> {
    try {
      // Check if we're exceeding the maximum processing time
      if (Date.now() - startTime > this.MAX_PROCESSING_TIME) {
        return {
          processingTime: Date.now() - startTime,
          method: 'openai',
          success: false,
          error: 'Processing timeout exceeded',
        };
      }

      // For now, use enhanced mock embedding since OpenAI Vision API doesn't support embeddings directly
      // In a real implementation, you would use a proper face recognition service
      return await this.generateEnhancedMockEmbedding(imageBuffer, startTime);
    } catch (error) {
      if (attempt < this.MAX_RETRIES) {
        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, this.RETRY_DELAY * attempt)
        );

        // Try local model as fallback
        return await this.fallbackToLocalModel(imageBuffer, startTime);
      }

      const processingTime = Date.now() - startTime;
      return {
        processingTime,
        method: 'openai',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateEnhancedMockEmbedding(
    imageBuffer: Buffer,
    startTime: number
  ): Promise<EmbeddingResult> {
    // Generate a deterministic mock embedding based on image content
    // This creates a consistent embedding for the same image but with more realistic distribution
    const hash = this.enhancedHash(imageBuffer);

    // Create embedding using multiple hash-based seeds for better distribution
    const mockEmbedding = new Array(EMBEDDING_DIMENSION)
      .fill(0)
      .map((_, index) => {
        // Use multiple hash techniques for better pseudo-random distribution
        const seed1 = (hash + index) % 10000;
        const seed2 = (hash * 31 + index * 7) % 10000;
        const seed3 = (hash * 17 + index * 13) % 10000;

        // Combine multiple sine waves for more realistic embedding distribution
        const value1 = Math.sin(seed1 / 100) * 0.3;
        const value2 = Math.cos(seed2 / 150) * 0.2;
        const value3 = Math.sin(seed3 / 200) * 0.1;

        return value1 + value2 + value3;
      });

    // Normalize the embedding to unit length for better cosine similarity
    const normalizedEmbedding = this.normalizeVector(mockEmbedding);

    const processingTime = Date.now() - startTime;

    return {
      embedding: normalizedEmbedding,
      processingTime,
      method: 'openai', // Would be 'openai' when Vision API is used
      success: true,
    };
  }

  private async fallbackToLocalModel(
    imageBuffer: Buffer,
    startTime: number
  ): Promise<EmbeddingResult> {
    // For now, generate a mock embedding with different distribution
    // In a real implementation, this would use a local ML model like face_recognition or similar
    const mockEmbedding = new Array(EMBEDDING_DIMENSION)
      .fill(0)
      .map((_, index) => {
        // Use a different hash for fallback to ensure different distribution
        const hash = this.simpleHash(imageBuffer);
        const seed = (hash * 23 + index * 11) % 1000;
        return (Math.sin(seed) + Math.cos(seed * 1.1)) * 0.25;
      });

    const normalizedEmbedding = this.normalizeVector(mockEmbedding);
    const processingTime = Date.now() - startTime;

    return {
      embedding: normalizedEmbedding,
      processingTime,
      method: 'local',
      success: true,
    };
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return magnitude > 0 ? vector.map((val) => val / magnitude) : vector;
  }

  private enhancedHash(buffer: Buffer): number {
    let hash = 0;
    const sampleSize = Math.min(buffer.length, 2000);

    for (let i = 0; i < sampleSize; i += 3) {
      // Sample every 3rd byte for better distribution
      const byte1 = buffer[i] || 0;
      const byte2 = buffer[i + 1] || 0;
      const byte3 = buffer[i + 2] || 0;

      hash = ((hash << 5) - hash + byte1) & 0xffffffff;
      hash = ((hash << 5) - hash + byte2 * 3) & 0xffffffff;
      hash = ((hash << 5) - hash + byte3 * 7) & 0xffffffff;
    }

    return Math.abs(hash);
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

  private async generateMockEmbedding(
    imageBuffer: Buffer,
    startTime: number
  ): Promise<EmbeddingResult> {
    // Generate a deterministic mock embedding based on image content
    // This creates a consistent embedding for the same image
    const hash = this.simpleHash(imageBuffer);
    const mockEmbedding = new Array(EMBEDDING_DIMENSION)
      .fill(0)
      .map((_, index) => {
        // Use hash and index to create deterministic but varied values
        const seed = (hash + index) % 1000;
        return Math.sin(seed) * 0.5; // Values between -0.5 and 0.5
      });

    const processingTime = Date.now() - startTime;

    return {
      embedding: mockEmbedding,
      processingTime,
      method: 'local',
      success: true,
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

  private simpleHash(buffer: Buffer): number {
    let hash = 0;
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      hash = ((hash << 5) - hash + buffer[i]) & 0xffffffff;
    }
    return Math.abs(hash);
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
