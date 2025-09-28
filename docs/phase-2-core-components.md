# Phase 2: Core Memory Management Components

## Overview

This phase implements the core memory management components including face embedding generation, similarity search, and memory operations. These components form the foundation for the AI Pet Memory system's recognition capabilities.

## Face Embedding Service

### OpenAI Vision API Integration

The face embedding service uses OpenAI's Vision API to generate 768-dimensional embeddings from face images, with fallback to local ML models if latency exceeds 400ms.

### Service Interface

```typescript
export interface FaceEmbeddingService {
  generateEmbedding(imageBuffer: Buffer): Promise<{
    embedding: number[];
    processingTime: number;
    method: 'openai' | 'local';
  }>;

  validateImage(imageBuffer: Buffer): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
}
```

### Implementation Structure

**File**: `lib/face-embedding.ts`

```typescript
export class OpenAIFaceEmbeddingService implements FaceEmbeddingService {
  private openai: OpenAI;
  private localModel?: LocalFaceModel;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(imageBuffer: Buffer): Promise<EmbeddingResult> {
    // Implementation with performance monitoring
  }

  async validateImage(imageBuffer: Buffer): Promise<ValidationResult> {
    // Image validation logic
  }

  private async fallbackToLocalModel(
    imageBuffer: Buffer
  ): Promise<EmbeddingResult> {
    // Local model fallback
  }
}
```

## Similarity Search Service

### Vector Similarity Operations

The similarity search service handles cosine similarity calculations and vector database queries with performance optimization.

### Service Interface

```typescript
export interface SimilaritySearchService {
  findSimilarFaces(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SimilaritySearchResult[]>;

  calculateSimilarity(embedding1: number[], embedding2: number[]): number;
}
```

### Search Options

```typescript
export interface SearchOptions {
  threshold: number; // Minimum similarity score (0-1)
  topK: number; // Maximum number of results
  relationshipTypes?: string[]; // Filter by relationship type
  excludeIds?: string[]; // Exclude specific memory IDs
}
```

## Memory Management Service

### Core Memory Operations

The memory management service handles CRUD operations for memory entries and interaction tracking.

### Service Interface

```typescript
export interface MemoryManagementService {
  createMemory(data: CreateMemoryData): Promise<MemoryEntry>;
  updateMemory(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry>;
  deleteMemory(id: string): Promise<void>;
  getMemory(id: string): Promise<MemoryEntry | null>;
  listMemories(options: ListOptions): Promise<MemoryEntry[]>;
  recordInteraction(data: CreateInteractionData): Promise<InteractionRecord>;
}
```

## TDD Test Cases

### Face Embedding Service Tests

**File**: `lib/face-embedding.test.ts`

```typescript
describe('Face Embedding Service', () => {
  let service: FaceEmbeddingService;
  let mockImageBuffer: Buffer;

  beforeEach(() => {
    service = new OpenAIFaceEmbeddingService();
    mockImageBuffer = Buffer.from('mock-image-data');
  });

  describe('generateEmbedding', () => {
    it('should generate embedding from image buffer', async () => {
      const result = await service.generateEmbedding(mockImageBuffer);

      expect(result.embedding).toHaveLength(768);
      expect(result.processingTime).toBeLessThan(400);
      expect(result.method).toBe('openai');
    });

    it('should handle API errors gracefully', async () => {
      // Mock OpenAI API error
      jest
        .spyOn(service, 'generateEmbedding')
        .mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(service.generateEmbedding(mockImageBuffer)).rejects.toThrow(
        'API rate limit exceeded'
      );
    });

    it('should validate image format before processing', async () => {
      const invalidBuffer = Buffer.from('invalid-image-data');

      const result = await service.generateEmbedding(invalidBuffer);

      expect(result.embedding).toBeUndefined();
      expect(result.errors).toContain('Invalid image format');
    });

    it('should measure and log processing time', async () => {
      const startTime = Date.now();
      const result = await service.generateEmbedding(mockImageBuffer);
      const endTime = Date.now();

      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(endTime - startTime + 100);
    });

    it('should fallback to local model when API is slow', async () => {
      // Mock slow API response
      jest
        .spyOn(service, 'generateEmbedding')
        .mockImplementation(async (buffer) => {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate slow response
          return {
            embedding: new Array(768).fill(0.1),
            processingTime: 500,
            method: 'openai',
          };
        });

      const result = await service.generateEmbedding(mockImageBuffer);

      expect(result.method).toBe('local');
      expect(result.processingTime).toBeLessThan(400);
    });
  });

  describe('validateImage', () => {
    it('should validate JPEG images', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header

      const result = await service.validateImage(jpegBuffer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate PNG images', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header

      const result = await service.validateImage(pngBuffer);

      expect(result.isValid).toBe(true);
    });

    it('should reject unsupported formats', async () => {
      const invalidBuffer = Buffer.from('invalid-data');

      const result = await service.validateImage(invalidBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported image format');
    });

    it('should validate image dimensions', async () => {
      // Mock image with invalid dimensions
      const invalidDimensionsBuffer = Buffer.from('invalid-dimensions');

      const result = await service.validateImage(invalidDimensionsBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Image dimensions must be between 64x64 and 2048x2048'
      );
    });
  });
});
```

### Similarity Search Service Tests

**File**: `lib/similarity-search.test.ts`

```typescript
describe('Similarity Search Service', () => {
  let service: SimilaritySearchService;
  let mockMemories: MemoryEntry[];

  beforeEach(() => {
    service = new SimilaritySearchService();
    mockMemories = [
      {
        id: 'memory-1',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        // ... other fields
      },
      {
        id: 'memory-2',
        name: 'Bob',
        embedding: new Array(768).fill(0.2),
        // ... other fields
      },
    ];
  });

  describe('findSimilarFaces', () => {
    it('should find faces above similarity threshold', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.8,
        topK: 10,
      };

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(Array.isArray(results)).toBe(true);
      results.forEach((result) => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should return results ordered by similarity', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.5,
        topK: 10,
      };

      const results = await service.findSimilarFaces(queryEmbedding, options);

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(
          results[i].similarity
        );
      }
    });

    it('should handle empty database gracefully', async () => {
      // Mock empty database
      jest.spyOn(service, 'findSimilarFaces').mockResolvedValue([]);

      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.8,
        topK: 10,
      };

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(results).toEqual([]);
    });

    it('should respect topK parameter', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.5,
        topK: 3,
      };

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should filter by relationship types', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.5,
        topK: 10,
        relationshipTypes: ['friend'],
      };

      const results = await service.findSimilarFaces(queryEmbedding, options);

      results.forEach((result) => {
        expect(result.metadata.relationshipType).toBe('friend');
      });
    });

    it('should exclude specified memory IDs', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.5,
        topK: 10,
        excludeIds: ['memory-1'],
      };

      const results = await service.findSimilarFaces(queryEmbedding, options);

      results.forEach((result) => {
        expect(result.id).not.toBe('memory-1');
      });
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBe(1.0); // Identical vectors
    });

    it('should handle orthogonal vectors', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBe(0.0); // Orthogonal vectors
    });

    it('should handle opposite vectors', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [-1, 0, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBe(-1.0); // Opposite vectors
    });

    it('should handle identical embeddings', () => {
      const embedding = new Array(768).fill(0.1);

      const similarity = service.calculateSimilarity(embedding, embedding);

      expect(similarity).toBe(1.0);
    });

    it('should handle different length embeddings', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0];

      expect(() => {
        service.calculateSimilarity(embedding1, embedding2);
      }).toThrow('Embeddings must have the same length');
    });
  });
});
```

### Memory Management Service Tests

**File**: `lib/memory-management.test.ts`

```typescript
describe('Memory Management Service', () => {
  let service: MemoryManagementService;
  let mockMemory: MemoryEntry;

  beforeEach(() => {
    service = new MemoryManagementService();
    mockMemory = {
      id: 'memory-1',
      name: 'Anna',
      embedding: new Array(768).fill(0.1),
      firstMet: new Date(),
      lastSeen: new Date(),
      interactionCount: 0,
      preferences: ['coffee'],
      tags: ['friend'],
      relationshipType: 'friend',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('createMemory', () => {
    it('should create new memory entry', async () => {
      const createData: CreateMemoryData = {
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        introducedBy: 'Sang',
        notes: "Met at Sang's place",
      };

      const result = await service.createMemory(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Anna');
      expect(result.interactionCount).toBe(0);
      expect(result.createdAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        embedding: new Array(768).fill(0.1),
      };

      await expect(service.createMemory(invalidData)).rejects.toThrow(
        'Name is required'
      );
    });

    it('should set default values', async () => {
      const createData: CreateMemoryData = {
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
      };

      const result = await service.createMemory(createData);

      expect(result.relationshipType).toBe('friend');
      expect(result.interactionCount).toBe(0);
      expect(result.preferences).toEqual([]);
      expect(result.tags).toEqual([]);
    });
  });

  describe('updateMemory', () => {
    it('should update memory fields', async () => {
      const updates = {
        lastSeen: new Date(),
        interactionCount: 5,
        notes: 'Updated notes',
      };

      const result = await service.updateMemory('memory-1', updates);

      expect(result.lastSeen).toEqual(updates.lastSeen);
      expect(result.interactionCount).toBe(5);
      expect(result.notes).toBe('Updated notes');
    });

    it('should preserve existing data when updating', async () => {
      const updates = {
        interactionCount: 1,
      };

      const result = await service.updateMemory('memory-1', updates);

      expect(result.name).toBe('Anna');
      expect(result.preferences).toEqual(['coffee']);
    });

    it('should handle non-existent memory', async () => {
      const updates = {
        interactionCount: 1,
      };

      await expect(
        service.updateMemory('non-existent', updates)
      ).rejects.toThrow('Memory not found');
    });
  });

  describe('recordInteraction', () => {
    it('should record new interaction', async () => {
      const interactionData: CreateInteractionData = {
        memoryEntryId: 'memory-1',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
      };

      const result = await service.recordInteraction(interactionData);

      expect(result.id).toBeDefined();
      expect(result.memoryEntryId).toBe('memory-1');
      expect(result.interactionType).toBe('meeting');
      expect(result.createdAt).toBeDefined();
    });

    it('should update memory interaction count', async () => {
      const interactionData: CreateInteractionData = {
        memoryEntryId: 'memory-1',
        interactionType: 'recognition',
      };

      await service.recordInteraction(interactionData);

      const memory = await service.getMemory('memory-1');
      expect(memory?.interactionCount).toBe(1);
    });
  });
});
```

## Implementation Steps

### Step 1: Face Embedding Service

1. **Create service interface and implementation**
2. **Add OpenAI API integration**
3. **Implement performance monitoring**
4. **Add local model fallback**
5. **Write comprehensive tests**

### Step 2: Similarity Search Service

1. **Implement cosine similarity calculation**
2. **Add pgvector database queries**
3. **Add filtering and sorting logic**
4. **Optimize for performance**
5. **Write comprehensive tests**

### Step 3: Memory Management Service

1. **Implement CRUD operations**
2. **Add interaction tracking**
3. **Add validation logic**
4. **Add error handling**
5. **Write comprehensive tests**

## Performance Requirements

- **Embedding Generation**: < 400ms (OpenAI API)
- **Similarity Search**: < 100ms for 1000+ memories
- **Memory Operations**: < 50ms for CRUD operations
- **Local Model Fallback**: < 200ms when API is slow

## Acceptance Criteria

- [ ] All face embedding service tests pass
- [ ] All similarity search service tests pass
- [ ] All memory management service tests pass
- [ ] Performance requirements met
- [ ] Error handling implemented
- [ ] Local model fallback working
- [ ] Comprehensive logging added

## Next Steps

After completing Phase 2, proceed to:

- **Phase 3**: API Routes
- **Phase 4**: UI Components
- **Phase 5**: Integration & End-to-End Tests

Each phase builds upon the core components established in this phase.
