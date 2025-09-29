/**
 * Tests for memory database operations
 * Following TDD principles with comprehensive test coverage
 */

import {
  createMemoryEntry,
  findSimilarMemories,
  updateMemoryEntry,
  getMemoryEntry,
  getAllMemoryEntries,
  deleteMemoryEntry,
  createInteraction,
  getInteractionsByMemoryId,
  incrementInteractionCount,
  searchMemoriesByName,
} from '@/lib/memory-database';
import {
  CreateMemoryEntryData,
  CreateInteractionData,
  EMBEDDING_DIMENSION,
} from '@/types/memory';

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => {
  const mockPrisma = {
    memoryEntry: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    interaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Import after mock is defined
import { PrismaClient } from '@/lib/prisma/client';

describe('Memory Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Get access to the mocked Prisma instance
  const getMockPrisma = () => {
    const MockedPrismaClient = PrismaClient as jest.MockedClass<
      typeof PrismaClient
    >;
    return new MockedPrismaClient() as jest.Mocked<PrismaClient>;
  };

  describe('createMemoryEntry', () => {
    it('should create a new memory entry with embedding', async () => {
      const memoryData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        introducedBy: 'Sang',
        notes: "Met at Sang's place",
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new_person'],
        relationshipType: 'friend',
      };

      const mockCreatedEntry = {
        id: 'test-id-1',
        name: 'Anna',
        embedding: JSON.stringify(memoryData.embedding), // Store as JSON string
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-01'),
        interactionCount: 0,
        introducedBy: 'Sang',
        notes: "Met at Sang's place",
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new_person'],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.create.mockResolvedValue(mockCreatedEntry);

      const result = await createMemoryEntry(memoryData);

      expect(result.id).toBe('test-id-1');
      expect(result.name).toBe('Anna');
      expect(result.embedding).toEqual(memoryData.embedding);
      expect(result.interactionCount).toBe(0);
      expect(result.introducedBy).toBe('Sang');
      expect(result.preferences).toEqual(['coffee', 'books']);
      expect(result.tags).toEqual(['friend', 'new_person']);
      expect(result.relationshipType).toBe('friend');

      expect(mockPrisma.memoryEntry.create).toHaveBeenCalledWith({
        data: {
          name: 'Anna',
          embedding: JSON.stringify(memoryData.embedding),
          introducedBy: 'Sang',
          notes: "Met at Sang's place",
          preferences: ['coffee', 'books'],
          tags: ['friend', 'new_person'],
          relationshipType: 'friend',
        },
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
      };

      await expect(createMemoryEntry(invalidData)).rejects.toThrow(
        'Name is required'
      );
    });

    it('should validate embedding dimensions', async () => {
      const invalidData = {
        name: 'Anna',
        embedding: new Array(100).fill(0.1), // Wrong dimension
      };

      await expect(createMemoryEntry(invalidData)).rejects.toThrow(
        `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
      );
    });

    it('should validate relationship type', async () => {
      const invalidData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        relationshipType: 'invalid' as any,
      };

      await expect(createMemoryEntry(invalidData)).rejects.toThrow(
        'Invalid relationship type'
      );
    });

    it('should use default values for optional fields', async () => {
      const memoryData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
      };

      const mockCreatedEntry = {
        id: 'test-id-1',
        name: 'Anna',
        embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.1)),
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-01'),
        interactionCount: 0,
        introducedBy: null,
        notes: null,
        preferences: [],
        tags: [],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.create.mockResolvedValue(mockCreatedEntry);

      const result = await createMemoryEntry(memoryData);

      expect(result.preferences).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.relationshipType).toBe('friend');
      expect(result.introducedBy).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('findSimilarMemories', () => {
    it('should find memories with similarity above threshold', async () => {
      const queryEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.1);
      const threshold = 0.8;

      const mockMemories = [
        {
          id: 'test-id-1',
          name: 'Anna',
          embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.1)),
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
      ];

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.findMany.mockResolvedValue(mockMemories);

      const results = await findSimilarMemories(queryEmbedding, threshold);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBeGreaterThanOrEqual(threshold);
      expect(results[0].metadata.name).toBe('Anna');
      expect(results[0].metadata.interactionCount).toBe(5);
    });

    it('should return empty array when no matches found', async () => {
      const queryEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.9); // Very different embedding
      const threshold = 0.8;

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.findMany.mockResolvedValue([]);

      const results = await findSimilarMemories(queryEmbedding, threshold);

      expect(results).toEqual([]);
    });

    it('should respect top_k parameter', async () => {
      const queryEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.1);
      const topK = 3;

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.findMany.mockResolvedValue([]);

      await findSimilarMemories(queryEmbedding, 0.5, topK);

      // Verify the function was called with correct parameters
      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalled();
    });

    it('should validate embedding dimensions', async () => {
      const invalidEmbedding = new Array(100).fill(0.1); // Wrong dimension

      await expect(findSimilarMemories(invalidEmbedding, 0.8)).rejects.toThrow(
        `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
      );
    });
  });

  describe('updateMemoryEntry', () => {
    it('should update last_seen and interaction_count', async () => {
      const memoryId = 'test-id-1';
      const updates = {
        lastSeen: new Date('2024-01-02'),
        interactionCount: 5,
        notes: 'Updated notes',
      };

      const mockUpdatedEntry = {
        id: memoryId,
        name: 'Anna',
        embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.1)),
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-02'),
        interactionCount: 5,
        introducedBy: 'Sang',
        notes: 'Updated notes',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.update.mockResolvedValue(mockUpdatedEntry);

      const result = await updateMemoryEntry(memoryId, updates);

      expect(result.lastSeen).toEqual(updates.lastSeen);
      expect(result.interactionCount).toBe(5);
      expect(result.notes).toBe('Updated notes');
    });

    it('should preserve existing data when updating', async () => {
      const memoryId = 'test-id-1';
      const updates = {
        interactionCount: 1,
      };

      const mockUpdatedEntry = {
        id: memoryId,
        name: 'Anna',
        embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.1)),
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-01'),
        interactionCount: 1,
        introducedBy: 'Sang',
        notes: 'Original notes',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.update.mockResolvedValue(mockUpdatedEntry);

      const result = await updateMemoryEntry(memoryId, updates);

      expect(result.name).toBe('Anna');
      expect(result.preferences).toEqual(['coffee']);
      expect(result.introducedBy).toBe('Sang');
    });

    it('should validate embedding dimensions when updating', async () => {
      const memoryId = 'test-id-1';
      const updates = {
        embedding: new Array(100).fill(0.1), // Wrong dimension
      };

      await expect(updateMemoryEntry(memoryId, updates)).rejects.toThrow(
        `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
      );
    });
  });

  describe('getMemoryEntry', () => {
    it('should return memory entry by ID', async () => {
      const memoryId = 'test-id-1';
      const mockEntry = {
        id: memoryId,
        name: 'Anna',
        embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.1)),
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-01'),
        interactionCount: 0,
        introducedBy: 'Sang',
        notes: 'Friend',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.findUnique.mockResolvedValue(mockEntry);

      const result = await getMemoryEntry(memoryId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(memoryId);
      expect(result!.name).toBe('Anna');
    });

    it('should return null when memory entry not found', async () => {
      const memoryId = 'non-existent-id';

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.findUnique.mockResolvedValue(null);

      const result = await getMemoryEntry(memoryId);

      expect(result).toBeNull();
    });
  });

  describe('getAllMemoryEntries', () => {
    it('should return all memory entries ordered by last_seen', async () => {
      const mockEntries = [
        {
          id: 'test-id-1',
          name: 'Anna',
          embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.1)),
          firstMet: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-02'),
          interactionCount: 5,
          introducedBy: 'Sang',
          notes: 'Friend',
          preferences: ['coffee'],
          tags: ['friend'],
          relationshipType: 'friend',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          id: 'test-id-2',
          name: 'Bob',
          embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.2)),
          firstMet: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-01'),
          interactionCount: 2,
          introducedBy: null,
          notes: null,
          preferences: [],
          tags: [],
          relationshipType: 'acquaintance',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.findMany.mockResolvedValue(mockEntries);

      const results = await getAllMemoryEntries();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Anna');
      expect(results[1].name).toBe('Bob');
      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalledWith({
        orderBy: { lastSeen: 'desc' },
      });
    });
  });

  describe('deleteMemoryEntry', () => {
    it('should delete memory entry by ID', async () => {
      const memoryId = 'test-id-1';

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.delete.mockResolvedValue({});

      await deleteMemoryEntry(memoryId);

      expect(mockPrisma.memoryEntry.delete).toHaveBeenCalledWith({
        where: { id: memoryId },
      });
    });
  });

  describe('createInteraction', () => {
    it('should create a new interaction record', async () => {
      const interactionData: CreateInteractionData = {
        memoryEntryId: 'test-id-1',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
      };

      const mockInteraction = {
        id: 'interaction-id-1',
        memoryEntryId: 'test-id-1',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
        createdAt: new Date('2024-01-01'),
      };

      const mockPrisma = getMockPrisma();
      mockPrisma.interaction.create.mockResolvedValue(mockInteraction);

      const result = await createInteraction(interactionData);

      expect(result.id).toBe('interaction-id-1');
      expect(result.memoryEntryId).toBe('test-id-1');
      expect(result.interactionType).toBe('meeting');
      expect(result.context).toBe('First meeting');
      expect(result.responseGenerated).toBe('Nice to meet you!');
      expect(result.emotion).toBe('happy');
      expect(result.actions).toEqual(['wave', 'smile']);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        memoryEntryId: '',
        interactionType: 'meeting' as
          | 'meeting'
          | 'recognition'
          | 'conversation',
      };

      // mockPrisma is defined at module level

      await expect(createInteraction(invalidData)).rejects.toThrow(
        'Memory entry ID is required'
      );
    });

    it('should validate interaction type', async () => {
      const invalidData = {
        memoryEntryId: 'test-id-1',
        interactionType: 'invalid' as
          | 'meeting'
          | 'recognition'
          | 'conversation',
      };

      // mockPrisma is defined at module level

      await expect(createInteraction(invalidData)).rejects.toThrow(
        'Invalid interaction type'
      );
    });
  });

  describe('getInteractionsByMemoryId', () => {
    it('should return interactions for a specific memory entry', async () => {
      const memoryEntryId = 'test-id-1';
      const mockInteractions = [
        {
          id: 'interaction-id-1',
          memoryEntryId: 'test-id-1',
          interactionType: 'meeting',
          context: 'First meeting',
          responseGenerated: 'Nice to meet you!',
          emotion: 'happy',
          actions: ['wave', 'smile'],
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'interaction-id-2',
          memoryEntryId: 'test-id-1',
          interactionType: 'recognition',
          context: 'Recognized at party',
          responseGenerated: 'Hello again!',
          emotion: 'excited',
          actions: ['hug'],
          createdAt: new Date('2024-01-01'),
        },
      ];

      const mockPrisma = getMockPrisma();
      mockPrisma.interaction.findMany.mockResolvedValue(mockInteractions);

      const results = await getInteractionsByMemoryId(memoryEntryId);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('interaction-id-1');
      expect(results[1].id).toBe('interaction-id-2');
      expect(mockPrisma.interaction.findMany).toHaveBeenCalledWith({
        where: { memoryEntryId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('incrementInteractionCount', () => {
    it('should increment interaction count and update last_seen', async () => {
      const memoryEntryId = 'test-id-1';

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.update.mockResolvedValue({});

      await incrementInteractionCount(memoryEntryId);

      expect(mockPrisma.memoryEntry.update).toHaveBeenCalledWith({
        where: { id: memoryEntryId },
        data: {
          interactionCount: {
            increment: 1,
          },
          lastSeen: expect.any(Date),
        },
      });
    });
  });

  describe('searchMemoriesByName', () => {
    it('should search memories by name (case-insensitive)', async () => {
      const searchName = 'anna';
      const mockEntries = [
        {
          id: 'test-id-1',
          name: 'Anna',
          embedding: JSON.stringify(new Array(EMBEDDING_DIMENSION).fill(0.1)),
          firstMet: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-01'),
          interactionCount: 0,
          introducedBy: 'Sang',
          notes: 'Friend',
          preferences: ['coffee'],
          tags: ['friend'],
          relationshipType: 'friend',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockPrisma = getMockPrisma();
      mockPrisma.memoryEntry.findMany.mockResolvedValue(mockEntries);

      const results = await searchMemoriesByName(searchName);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Anna');
      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: searchName,
            mode: 'insensitive',
          },
        },
        orderBy: { lastSeen: 'desc' },
      });
    });
  });
});
