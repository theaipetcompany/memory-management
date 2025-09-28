import {
  MemoryManagementService,
  CreateMemoryData,
  ListOptions,
} from '@/lib/memory-management';
import {
  MemoryEntry,
  InteractionRecord,
  CreateInteractionData,
} from '@/types/memory';

// Mock dependencies
jest.mock('@/lib/memory-database', () => ({
  createMemoryEntry: jest.fn(),
  updateMemoryEntry: jest.fn(),
  deleteMemoryEntry: jest.fn(),
  getMemoryEntry: jest.fn(),
  getAllMemoryEntries: jest.fn(),
  createInteraction: jest.fn(),
  incrementInteractionCount: jest.fn(),
}));

const mockGenerateEmbedding = jest.fn();
jest.mock('@/lib/face-embedding', () => ({
  OpenAIFaceEmbeddingService: jest.fn().mockImplementation(() => ({
    generateEmbedding: mockGenerateEmbedding,
    validateImage: jest.fn(),
  })),
}));

jest.mock('@/lib/similarity-search', () => ({
  SimilaritySearchService: {
    findSimilarFaces: jest.fn(),
    calculateSimilarity: jest.fn(),
  },
}));

describe('Memory Management Service', () => {
  let service: MemoryManagementService;
  let mockMemoryEntry: MemoryEntry;
  let mockInteraction: InteractionRecord;

  beforeEach(() => {
    service =
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

    mockInteraction = {
      id: 'interaction-1',
      memoryEntryId: 'memory-1',
      interactionType: 'meeting',
      context: 'First meeting',
      responseGenerated: 'Nice to meet you!',
      emotion: 'happy',
      actions: ['wave', 'smile'],
      createdAt: new Date('2024-01-01'),
    };

    // Clear all mocks
    mockGenerateEmbedding.mockClear();
    require('@/lib/memory-database').createMemoryEntry.mockClear();
    require('@/lib/memory-database').updateMemoryEntry.mockClear();
    require('@/lib/memory-database').deleteMemoryEntry.mockClear();
    require('@/lib/memory-database').getMemoryEntry.mockClear();
    require('@/lib/memory-database').getAllMemoryEntries.mockClear();
    require('@/lib/memory-database').createInteraction.mockClear();
    require('@/lib/memory-database').incrementInteractionCount.mockClear();
    require('@/lib/similarity-search').SimilaritySearchService.findSimilarFaces.mockClear();
  });

  describe('createMemory', () => {
    it('should create memory with face embedding', async () => {
      const createData: CreateMemoryData = {
        name: 'Anna',
        imageBuffer: Buffer.from('mock-image-data'),
        introducedBy: 'Sang',
        notes: 'Friend',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
      };

      // Mock face embedding service
      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(768).fill(0.1),
        processingTime: 200,
        method: 'openai',
        success: true,
      });

      // Mock database service
      const mockCreateMemoryEntry =
        require('@/lib/memory-database').createMemoryEntry;
      mockCreateMemoryEntry.mockResolvedValue(mockMemoryEntry);

      const result = await service.createMemory(createData);

      expect(result).toEqual(mockMemoryEntry);
      expect(mockGenerateEmbedding).toHaveBeenCalledWith(
        createData.imageBuffer
      );
      expect(mockCreateMemoryEntry).toHaveBeenCalledWith({
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        introducedBy: 'Sang',
        notes: 'Friend',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
      });
    });

    it('should handle embedding generation failure', async () => {
      const createData: CreateMemoryData = {
        name: 'Anna',
        imageBuffer: Buffer.from('invalid-image'),
        relationshipType: 'friend',
      };

      // Mock face embedding service failure
      mockGenerateEmbedding.mockResolvedValue({
        success: false,
        error: 'Invalid image format',
        processingTime: 100,
        method: 'openai',
      });

      await expect(service.createMemory(createData)).rejects.toThrow(
        'Invalid image format'
      );
    });
  });

  describe('updateMemory', () => {
    it('should update memory entry', async () => {
      const updates = {
        notes: 'Updated notes',
        interactionCount: 6,
      };

      const mockUpdateMemoryEntry =
        require('@/lib/memory-database').updateMemoryEntry;
      mockUpdateMemoryEntry.mockResolvedValue({
        ...mockMemoryEntry,
        ...updates,
      });

      const result = await service.updateMemory('memory-1', updates);

      expect(result.notes).toBe('Updated notes');
      expect(result.interactionCount).toBe(6);
      expect(mockUpdateMemoryEntry).toHaveBeenCalledWith('memory-1', updates);
    });

    it('should handle non-existent memory', async () => {
      const mockUpdateMemoryEntry =
        require('@/lib/memory-database').updateMemoryEntry;
      mockUpdateMemoryEntry.mockRejectedValue(new Error('Memory not found'));

      await expect(service.updateMemory('non-existent', {})).rejects.toThrow(
        'Memory not found'
      );
    });
  });

  describe('deleteMemory', () => {
    it('should delete memory entry', async () => {
      const mockDeleteMemoryEntry =
        require('@/lib/memory-database').deleteMemoryEntry;
      mockDeleteMemoryEntry.mockResolvedValue(undefined);

      await service.deleteMemory('memory-1');

      expect(mockDeleteMemoryEntry).toHaveBeenCalledWith('memory-1');
    });
  });

  describe('getMemory', () => {
    it('should retrieve memory entry', async () => {
      const mockGetMemoryEntry =
        require('@/lib/memory-database').getMemoryEntry;
      mockGetMemoryEntry.mockResolvedValue(mockMemoryEntry);

      const result = await service.getMemory('memory-1');

      expect(result).toEqual(mockMemoryEntry);
      expect(mockGetMemoryEntry).toHaveBeenCalledWith('memory-1');
    });

    it('should return null for non-existent memory', async () => {
      const mockGetMemoryEntry =
        require('@/lib/memory-database').getMemoryEntry;
      mockGetMemoryEntry.mockResolvedValue(null);

      const result = await service.getMemory('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listMemories', () => {
    it('should list all memories', async () => {
      const mockGetAllMemoryEntries =
        require('@/lib/memory-database').getAllMemoryEntries;
      mockGetAllMemoryEntries.mockResolvedValue([mockMemoryEntry]);

      const options: ListOptions = {
        limit: 10,
        offset: 0,
      };

      const result = await service.listMemories(options);

      expect(result).toEqual([mockMemoryEntry]);
      expect(mockGetAllMemoryEntries).toHaveBeenCalled();
    });

    it('should filter memories by relationship type', async () => {
      const mockGetAllMemoryEntries =
        require('@/lib/memory-database').getAllMemoryEntries;
      mockGetAllMemoryEntries.mockResolvedValue([mockMemoryEntry]);

      const options: ListOptions = {
        limit: 10,
        offset: 0,
        relationshipTypes: ['friend'],
      };

      const result = await service.listMemories(options);

      expect(result).toEqual([mockMemoryEntry]);
    });
  });

  describe('recordInteraction', () => {
    it('should record interaction and increment count', async () => {
      const interactionData: CreateInteractionData = {
        memoryEntryId: 'memory-1',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
      };

      const mockCreateInteraction =
        require('@/lib/memory-database').createInteraction;
      const mockIncrementInteractionCount =
        require('@/lib/memory-database').incrementInteractionCount;

      mockCreateInteraction.mockResolvedValue(mockInteraction);
      mockIncrementInteractionCount.mockResolvedValue(undefined);

      const result = await service.recordInteraction(interactionData);

      expect(result).toEqual(mockInteraction);
      expect(mockCreateInteraction).toHaveBeenCalledWith(interactionData);
      expect(mockIncrementInteractionCount).toHaveBeenCalledWith('memory-1');
    });
  });

  describe('recognizeFace', () => {
    it('should recognize face and return match', async () => {
      const imageBuffer = Buffer.from('mock-image-data');
      const threshold = 0.8;

      // Mock face embedding service
      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(768).fill(0.1),
        processingTime: 200,
        method: 'openai',
        success: true,
      });

      // Mock similarity search service
      const mockSimilaritySearch =
        require('@/lib/similarity-search').SimilaritySearchService;
      mockSimilaritySearch.findSimilarFaces.mockResolvedValue([
        {
          id: 'memory-1',
          similarity: 0.95,
          metadata: mockMemoryEntry,
        },
      ]);

      const result = await service.recognizeFace(imageBuffer, threshold);

      expect(result.recognized).toBe(true);
      expect(result.memoryEntry).toEqual(mockMemoryEntry);
      expect(result.confidence).toBe(0.95);
      expect(result.similarMemories).toHaveLength(1);
    });

    it('should return no match when similarity is below threshold', async () => {
      const imageBuffer = Buffer.from('mock-image-data');
      const threshold = 0.8;

      // Mock face embedding service
      mockGenerateEmbedding.mockResolvedValue({
        embedding: new Array(768).fill(0.1),
        processingTime: 200,
        method: 'openai',
        success: true,
      });

      // Mock similarity search service with low similarity
      const mockSimilaritySearch =
        require('@/lib/similarity-search').SimilaritySearchService;
      mockSimilaritySearch.findSimilarFaces.mockResolvedValue([
        {
          id: 'memory-1',
          similarity: 0.5,
          metadata: mockMemoryEntry,
        },
      ]);

      const result = await service.recognizeFace(imageBuffer, threshold);

      expect(result.recognized).toBe(false);
      expect(result.memoryEntry).toBeUndefined();
      expect(result.confidence).toBe(0.5);
      expect(result.similarMemories).toHaveLength(1);
    });
  });
});
