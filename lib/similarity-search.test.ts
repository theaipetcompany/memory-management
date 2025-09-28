import {
  SimilaritySearchService,
  SearchOptions,
} from '@/lib/similarity-search';
import { MemoryEntry, SimilaritySearchResult } from '@/types/memory';

// Mock the memory database
jest.mock('@/lib/memory-database', () => ({
  findSimilarMemories: jest.fn(),
}));

describe('Similarity Search Service', () => {
  let service: SimilaritySearchService;
  let mockMemories: MemoryEntry[];

  beforeEach(() => {
    service = SimilaritySearchService; // Use the singleton instance
    mockMemories = [
      {
        id: 'memory-1',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-01'),
        interactionCount: 5,
        introducedBy: 'Sang',
        notes: 'Friend',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'memory-2',
        name: 'Bob',
        embedding: new Array(768).fill(0.2),
        firstMet: new Date('2024-01-02'),
        lastSeen: new Date('2024-01-02'),
        interactionCount: 3,
        introducedBy: 'Anna',
        notes: 'Colleague',
        preferences: ['tea'],
        tags: ['colleague'],
        relationshipType: 'acquaintance',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
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

      // Mock database response
      const mockFindSimilarMemories =
        require('@/lib/memory-database').findSimilarMemories;
      mockFindSimilarMemories.mockResolvedValue([
        {
          id: 'memory-1',
          similarity: 0.95,
          metadata: mockMemories[0],
        },
      ]);

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBeGreaterThanOrEqual(0.8);
      expect(mockFindSimilarMemories).toHaveBeenCalledWith(
        queryEmbedding,
        0.8,
        10
      );
    });

    it('should return results ordered by similarity', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.5,
        topK: 10,
      };

      // Mock database response with multiple results
      const mockFindSimilarMemories =
        require('@/lib/memory-database').findSimilarMemories;
      mockFindSimilarMemories.mockResolvedValue([
        {
          id: 'memory-2',
          similarity: 0.6,
          metadata: mockMemories[1],
        },
        {
          id: 'memory-1',
          similarity: 0.95,
          metadata: mockMemories[0],
        },
      ]);

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeGreaterThanOrEqual(
        results[1].similarity
      );
    });

    it('should handle empty database gracefully', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.8,
        topK: 10,
      };

      // Mock empty database response
      const mockFindSimilarMemories =
        require('@/lib/memory-database').findSimilarMemories;
      mockFindSimilarMemories.mockResolvedValue([]);

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(results).toEqual([]);
    });

    it('should filter by relationship types when specified', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.5,
        topK: 10,
        relationshipTypes: ['friend'],
      };

      const mockFindSimilarMemories =
        require('@/lib/memory-database').findSimilarMemories;
      mockFindSimilarMemories.mockResolvedValue([
        {
          id: 'memory-1',
          similarity: 0.95,
          metadata: mockMemories[0],
        },
      ]);

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(results).toHaveLength(1);
      expect(results[0].metadata.relationshipType).toBe('friend');
    });

    it('should exclude specified memory IDs', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const options: SearchOptions = {
        threshold: 0.5,
        topK: 10,
        excludeIds: ['memory-1'],
      };

      const mockFindSimilarMemories =
        require('@/lib/memory-database').findSimilarMemories;
      mockFindSimilarMemories.mockResolvedValue([
        {
          id: 'memory-2',
          similarity: 0.6,
          metadata: mockMemories[1],
        },
      ]);

      const results = await service.findSimilarFaces(queryEmbedding, options);

      expect(results).toHaveLength(1);
      expect(results[0].id).not.toBe('memory-1');
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [-1, 0, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should handle zero vectors', () => {
      const embedding1 = [0, 0, 0];
      const embedding2 = [1, 0, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBe(0);
    });

    it('should handle different length vectors', () => {
      const embedding1 = [1, 0];
      const embedding2 = [1, 0, 0];

      const similarity = service.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBe(0);
    });
  });
});
