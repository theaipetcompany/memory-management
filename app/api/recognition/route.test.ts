// Mock dependencies
jest.mock('@/lib/memory-management', () => ({
  MemoryManagementService: jest.fn().mockImplementation(() => ({
    createMemory: jest.fn(),
    updateMemory: jest.fn(),
    deleteMemory: jest.fn(),
    getMemory: jest.fn(),
    listMemories: jest.fn(),
    recordInteraction: jest.fn(),
    recognizeFace: jest.fn(),
    searchMemories: jest.fn(),
    getMemoryStats: jest.fn(),
  })),
}));

jest.mock('@/lib/face-embedding', () => ({
  OpenAIFaceEmbeddingService: jest.fn().mockImplementation(() => ({
    generateEmbedding: jest.fn(),
    validateImage: jest.fn(),
  })),
}));

jest.mock('@/lib/similarity-search', () => ({
  SimilaritySearchService: {
    findSimilarFaces: jest.fn(),
    calculateSimilarity: jest.fn(),
  },
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
}));

describe('Recognition API', () => {
  let mockMemoryService: any;
  let mockMemoryEntry: any;

  beforeEach(() => {
    mockMemoryService =
      new (require('@/lib/memory-management').MemoryManagementService)();

    mockMemoryEntry = {
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
    };

    // Clear all mocks
    Object.values(mockMemoryService).forEach((method: any) => {
      if (typeof method === 'function' && method.mockClear) {
        method.mockClear();
      }
    });
  });

  describe('Face Recognition Service Integration', () => {
    it('should identify known faces', async () => {
      const recognitionResult = {
        recognized: true,
        memoryEntry: mockMemoryEntry,
        confidence: 0.95,
        similarMemories: [
          {
            id: 'memory-1',
            similarity: 0.95,
            metadata: mockMemoryEntry,
          },
        ],
      };

      mockMemoryService.recognizeFace.mockResolvedValue(recognitionResult);

      const imageBuffer = Buffer.from('mock-image-data');
      const threshold = 0.8;

      const result = await mockMemoryService.recognizeFace(
        imageBuffer,
        threshold
      );

      expect(result.recognized).toBe(true);
      expect(result.memoryEntry).toEqual(mockMemoryEntry);
      expect(result.confidence).toBe(0.95);
      expect(result.similarMemories).toHaveLength(1);
      expect(mockMemoryService.recognizeFace).toHaveBeenCalledWith(
        imageBuffer,
        threshold
      );
    });

    it('should return confidence scores', async () => {
      const recognitionResult = {
        recognized: true,
        memoryEntry: mockMemoryEntry,
        confidence: 0.85,
        similarMemories: [
          {
            id: 'memory-1',
            similarity: 0.85,
            metadata: mockMemoryEntry,
          },
        ],
      };

      mockMemoryService.recognizeFace.mockResolvedValue(recognitionResult);

      const imageBuffer = Buffer.from('mock-image-data');
      const result = await mockMemoryService.recognizeFace(imageBuffer);

      expect(result.confidence).toBe(0.85);
      expect(result.recognized).toBe(true);
    });

    it('should handle unknown faces', async () => {
      const recognitionResult = {
        recognized: false,
        memoryEntry: undefined,
        confidence: 0.3,
        similarMemories: [
          {
            id: 'memory-1',
            similarity: 0.3,
            metadata: mockMemoryEntry,
          },
        ],
      };

      mockMemoryService.recognizeFace.mockResolvedValue(recognitionResult);

      const imageBuffer = Buffer.from('unknown-face-data');
      const result = await mockMemoryService.recognizeFace(imageBuffer);

      expect(result.recognized).toBe(false);
      expect(result.memoryEntry).toBeUndefined();
      expect(result.confidence).toBe(0.3);
    });

    it('should respect similarity threshold', async () => {
      const recognitionResult = {
        recognized: false,
        memoryEntry: undefined,
        confidence: 0.7,
        similarMemories: [
          {
            id: 'memory-1',
            similarity: 0.7,
            metadata: mockMemoryEntry,
          },
        ],
      };

      mockMemoryService.recognizeFace.mockResolvedValue(recognitionResult);

      const imageBuffer = Buffer.from('similar-face-data');
      const threshold = 0.9; // High threshold

      const result = await mockMemoryService.recognizeFace(
        imageBuffer,
        threshold
      );

      expect(result.recognized).toBe(false);
      expect(result.confidence).toBeLessThan(threshold);
    });

    it('should learn new faces from uploaded images', async () => {
      const memoryData = {
        name: 'Anna',
        imageBuffer: Buffer.from('mock-image-data'),
        introducedBy: 'Sang',
        notes: 'New friend',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend' as const,
      };

      mockMemoryService.createMemory.mockResolvedValue(mockMemoryEntry);

      const result = await mockMemoryService.createMemory(memoryData);

      expect(result).toEqual(mockMemoryEntry);
      expect(mockMemoryService.createMemory).toHaveBeenCalledWith(memoryData);
    });

    it('should search similar faces using embeddings', async () => {
      const mockSimilaritySearch =
        require('@/lib/similarity-search').SimilaritySearchService;
      const searchResults = [
        {
          id: 'memory-1',
          similarity: 0.9,
          metadata: mockMemoryEntry,
        },
      ];

      mockSimilaritySearch.findSimilarFaces.mockResolvedValue(searchResults);

      const queryEmbedding = new Array(768).fill(0.1);
      const options = { threshold: 0.8, topK: 5 };

      const result = await mockSimilaritySearch.findSimilarFaces(
        queryEmbedding,
        options
      );

      expect(result).toEqual(searchResults);
      expect(mockSimilaritySearch.findSimilarFaces).toHaveBeenCalledWith(
        queryEmbedding,
        options
      );
    });

    it('should filter by relationship types', async () => {
      const mockSimilaritySearch =
        require('@/lib/similarity-search').SimilaritySearchService;
      const friendMemories = [
        {
          id: 'memory-1',
          similarity: 0.9,
          metadata: { ...mockMemoryEntry, relationshipType: 'friend' },
        },
      ];

      mockSimilaritySearch.findSimilarFaces.mockResolvedValue(friendMemories);

      const queryEmbedding = new Array(768).fill(0.1);
      const options = {
        threshold: 0.8,
        topK: 10,
        relationshipTypes: ['friend'],
      };

      const result = await mockSimilaritySearch.findSimilarFaces(
        queryEmbedding,
        options
      );

      expect(result).toEqual(friendMemories);
      expect(
        result.every((r: any) => r.metadata.relationshipType === 'friend')
      ).toBe(true);
    });

    it('should handle embedding generation errors', async () => {
      mockMemoryService.recognizeFace.mockRejectedValue(
        new Error('Invalid image format')
      );

      const imageBuffer = Buffer.from('invalid-image-data');

      await expect(
        mockMemoryService.recognizeFace(imageBuffer)
      ).rejects.toThrow('Invalid image format');
    });

    it('should calculate similarity between embeddings', async () => {
      const mockSimilaritySearch =
        require('@/lib/similarity-search').SimilaritySearchService;
      mockSimilaritySearch.calculateSimilarity.mockReturnValue(0.85);

      const embedding1 = new Array(768).fill(0.1);
      const embedding2 = new Array(768).fill(0.2);

      const similarity = mockSimilaritySearch.calculateSimilarity(
        embedding1,
        embedding2
      );

      expect(similarity).toBe(0.85);
      expect(mockSimilaritySearch.calculateSimilarity).toHaveBeenCalledWith(
        embedding1,
        embedding2
      );
    });
  });
});
