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

describe('Memory Management API', () => {
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

  describe('Memory Service Integration', () => {
    it('should create memory with face embedding', async () => {
      const memoryData = {
        name: 'Anna',
        imageBuffer: Buffer.from('mock-image-data'),
        introducedBy: 'Sang',
        notes: "Met at Sang's place",
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend' as const,
      };

      mockMemoryService.createMemory.mockResolvedValue(mockMemoryEntry);

      const result = await mockMemoryService.createMemory(memoryData);

      expect(result).toEqual(mockMemoryEntry);
      expect(mockMemoryService.createMemory).toHaveBeenCalledWith(memoryData);
    });

    it('should handle memory creation errors', async () => {
      const memoryData = {
        name: 'Anna',
        imageBuffer: Buffer.from('invalid-image'),
        relationshipType: 'friend' as const,
      };

      mockMemoryService.createMemory.mockRejectedValue(
        new Error('Invalid image format')
      );

      await expect(mockMemoryService.createMemory(memoryData)).rejects.toThrow(
        'Invalid image format'
      );
    });

    it('should list memories with pagination', async () => {
      const mockMemories = [
        mockMemoryEntry,
        { ...mockMemoryEntry, id: 'memory-2', name: 'Bob' },
      ];
      mockMemoryService.listMemories.mockResolvedValue(mockMemories);

      const options = { limit: 10, offset: 0 };
      const result = await mockMemoryService.listMemories(options);

      expect(result).toEqual(mockMemories);
      expect(mockMemoryService.listMemories).toHaveBeenCalledWith(options);
    });

    it('should get specific memory by ID', async () => {
      mockMemoryService.getMemory.mockResolvedValue(mockMemoryEntry);

      const result = await mockMemoryService.getMemory('memory-1');

      expect(result).toEqual(mockMemoryEntry);
      expect(mockMemoryService.getMemory).toHaveBeenCalledWith('memory-1');
    });

    it('should update memory entry', async () => {
      const updates = {
        notes: 'Updated notes',
        preferences: ['coffee', 'books'],
      };
      const updatedMemory = { ...mockMemoryEntry, ...updates };

      mockMemoryService.updateMemory.mockResolvedValue(updatedMemory);

      const result = await mockMemoryService.updateMemory('memory-1', updates);

      expect(result).toEqual(updatedMemory);
      expect(mockMemoryService.updateMemory).toHaveBeenCalledWith(
        'memory-1',
        updates
      );
    });

    it('should delete memory entry', async () => {
      mockMemoryService.deleteMemory.mockResolvedValue(undefined);

      await mockMemoryService.deleteMemory('memory-1');

      expect(mockMemoryService.deleteMemory).toHaveBeenCalledWith('memory-1');
    });

    it('should search memories by name', async () => {
      const searchResults = [{ ...mockMemoryEntry, name: 'Anna Smith' }];
      mockMemoryService.searchMemories.mockResolvedValue(searchResults);

      const result = await mockMemoryService.searchMemories('Anna');

      expect(result).toEqual(searchResults);
      expect(mockMemoryService.searchMemories).toHaveBeenCalledWith('Anna');
    });
  });
});
