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
  findSimilarMemories: jest.fn(),
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

describe('Memory Management Service - End-to-End Tests', () => {
  let service: MemoryManagementService;
  let mockMemoryEntry: MemoryEntry;
  let mockInteraction: InteractionRecord;

  beforeEach(() => {
    service =
      new (require('@/lib/memory-management').MemoryManagementService)();

    // Reset all mocks
    jest.clearAllMocks();

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

  describe('Complete Memory Management Flow', () => {
    it('should handle complete friend meeting and recognition flow', async () => {
      // Step 1: Create a new memory (friend meeting)
      const mockEmbedding = new Array(768).fill(0.2);
      mockGenerateEmbedding.mockResolvedValue({
        embedding: mockEmbedding,
        processingTime: 150,
        method: 'openai',
        success: true,
      });

      const { createMemoryEntry } = require('@/lib/memory-database');
      createMemoryEntry.mockResolvedValue({
        id: 'new-memory-1',
        name: 'John',
        embedding: JSON.stringify(mockEmbedding),
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-01'),
        interactionCount: 0,
        introducedBy: 'Alice',
        notes: 'Met at coffee shop',
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new'],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const mockImageBuffer = Buffer.from('fake-image-data');
      const newMemory = await service.createMemory({
        name: 'John',
        imageBuffer: mockImageBuffer,
        introducedBy: 'Alice',
        notes: 'Met at coffee shop',
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new'],
        relationshipType: 'friend',
      });

      expect(createMemoryEntry).toHaveBeenCalledWith({
        name: 'John',
        embedding: mockEmbedding,
        introducedBy: 'Alice',
        notes: 'Met at coffee shop',
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new'],
        relationshipType: 'friend',
      });

      // Step 2: Record an interaction
      const {
        createInteraction,
        incrementInteractionCount,
      } = require('@/lib/memory-database');
      createInteraction.mockResolvedValue({
        id: 'interaction-1',
        memoryEntryId: 'new-memory-1',
        interactionType: 'meeting',
        context: 'First meeting at coffee shop',
        responseGenerated: 'Hello John! Nice to meet you.',
        emotion: 'friendly',
        actions: ['greet', 'introduce'],
        createdAt: new Date('2024-01-01'),
      });
      incrementInteractionCount.mockResolvedValue(undefined);

      const interaction = await service.recordInteraction({
        memoryEntryId: 'new-memory-1',
        interactionType: 'meeting',
        context: 'First meeting at coffee shop',
        responseGenerated: 'Hello John! Nice to meet you.',
        emotion: 'friendly',
        actions: ['greet', 'introduce'],
      });

      expect(createInteraction).toHaveBeenCalledWith({
        memoryEntryId: 'new-memory-1',
        interactionType: 'meeting',
        context: 'First meeting at coffee shop',
        responseGenerated: 'Hello John! Nice to meet you.',
        emotion: 'friendly',
        actions: ['greet', 'introduce'],
      });
      expect(incrementInteractionCount).toHaveBeenCalledWith('new-memory-1');

      // Step 3: Later recognition of the same person
      const { findSimilarMemories } = require('@/lib/memory-database');
      findSimilarMemories.mockResolvedValue([
        {
          id: 'new-memory-1',
          similarity: 0.95,
          metadata: {
            id: 'new-memory-1',
            name: 'John',
            embedding: mockEmbedding,
            firstMet: new Date('2024-01-01'),
            lastSeen: new Date('2024-01-01'),
            interactionCount: 1,
            introducedBy: 'Alice',
            notes: 'Met at coffee shop',
            preferences: ['coffee', 'books'],
            tags: ['friend', 'new'],
            relationshipType: 'friend',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
      ]);

      const { SimilaritySearchService } = require('@/lib/similarity-search');
      SimilaritySearchService.findSimilarFaces.mockResolvedValue([
        {
          id: 'new-memory-1',
          similarity: 0.95,
          metadata: {
            id: 'new-memory-1',
            name: 'John',
            embedding: mockEmbedding,
            firstMet: new Date('2024-01-01'),
            lastSeen: new Date('2024-01-01'),
            interactionCount: 1,
            introducedBy: 'Alice',
            notes: 'Met at coffee shop',
            preferences: ['coffee', 'books'],
            tags: ['friend', 'new'],
            relationshipType: 'friend',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
      ]);

      const recognitionResult = await service.recognizeFace(
        mockImageBuffer,
        0.8
      );

      expect(recognitionResult.recognized).toBe(true);
      expect(recognitionResult.memoryEntry?.name).toBe('John');
      expect(recognitionResult.confidence).toBe(0.95);
      expect(recognitionResult.similarMemories).toHaveLength(1);
    });

    it('should handle memory consolidation and statistics', async () => {
      // Setup multiple memories
      const { getAllMemoryEntries } = require('@/lib/memory-database');
      const mockMemories = [
        {
          id: 'memory-1',
          name: 'Alice',
          embedding: new Array(768).fill(0.1),
          firstMet: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-15'),
          interactionCount: 5,
          introducedBy: 'Bob',
          notes: 'Good friend',
          preferences: ['tea', 'music'],
          tags: ['friend', 'close'],
          relationshipType: 'friend',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'memory-2',
          name: 'Bob',
          embedding: new Array(768).fill(0.2),
          firstMet: new Date('2024-01-05'),
          lastSeen: new Date('2024-01-20'),
          interactionCount: 3,
          introducedBy: 'Alice',
          notes: 'Colleague',
          preferences: ['coffee', 'sports'],
          tags: ['colleague', 'tennis'],
          relationshipType: 'acquaintance',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-20'),
        },
      ];

      getAllMemoryEntries.mockResolvedValue(mockMemories);

      const stats = await service.getMemoryStats();

      expect(stats.totalMemories).toBe(2);
      expect(stats.totalInteractions).toBe(8);
      expect(stats.averageInteractionsPerMemory).toBe(4.0);
      expect(stats.relationshipTypeCounts.friend).toBe(1);
      expect(stats.relationshipTypeCounts.acquaintance).toBe(1);
    });

    it('should handle search functionality across memories', async () => {
      const { getAllMemoryEntries } = require('@/lib/memory-database');
      const mockMemories = [
        {
          id: 'memory-1',
          name: 'Alice Johnson',
          embedding: new Array(768).fill(0.1),
          firstMet: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-15'),
          interactionCount: 5,
          introducedBy: 'Bob',
          notes: 'Good friend from college',
          preferences: ['tea', 'music'],
          tags: ['friend', 'close', 'college'],
          relationshipType: 'friend',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
      ];

      getAllMemoryEntries.mockResolvedValue(mockMemories);

      const searchResults = await service.searchMemories('college');

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Alice Johnson');
      expect(searchResults[0].tags).toContain('college');
    });
  });
});
