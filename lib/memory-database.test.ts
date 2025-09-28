import {
  createMemoryEntry,
  findSimilarMemories,
  updateMemoryEntry,
  getMemoryEntry,
  getAllMemoryEntries,
  deleteMemoryEntry,
  createInteraction,
  getInteractionsForMemory,
  incrementInteractionCount,
} from '@/lib/memory-database';
import {
  CreateMemoryEntryData,
  UpdateMemoryEntryData,
  CreateInteractionData,
} from '@/types/memory';

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    memoryEntry: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    interaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  })),
}));

describe('Memory Database Operations', () => {
  const mockPrisma = require('@/lib/prisma/client').PrismaClient.mock.results[0]
    .value;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMemoryEntry', () => {
    it('should create a new memory entry with embedding', async () => {
      const memoryData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        introducedBy: 'Sang',
        notes: "Met at Sang's place",
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new_person'],
        relationshipType: 'friend',
      };

      const mockCreatedEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
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

      mockPrisma.memoryEntry.create.mockResolvedValue(mockCreatedEntry);

      const result = await createMemoryEntry(memoryData);

      expect(result.id).toBe('test-id');
      expect(result.name).toBe('Anna');
      expect(result.embedding).toEqual(memoryData.embedding);
      expect(result.interactionCount).toBe(0);
      expect(result.preferences).toEqual(['coffee', 'books']);
      expect(result.tags).toEqual(['friend', 'new_person']);
      expect(mockPrisma.memoryEntry.create).toHaveBeenCalledWith({
        data: {
          name: 'Anna',
          introducedBy: 'Sang',
          notes: "Met at Sang's place",
          preferences: ['coffee', 'books'],
          tags: ['friend', 'new_person'],
          relationshipType: 'friend',
        },
      });
    });

    it('should validate required fields', async () => {
      const invalidData: CreateMemoryEntryData = {
        name: '',
        embedding: new Array(768).fill(0.1),
      };

      await expect(createMemoryEntry(invalidData)).rejects.toThrow(
        'Validation failed: Name is required'
      );
    });

    it('should validate embedding dimensions', async () => {
      const invalidData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(100).fill(0.1), // Wrong dimension
      };

      await expect(createMemoryEntry(invalidData)).rejects.toThrow(
        'Validation failed: Embedding must be a 768-dimensional vector'
      );
    });

    it('should handle duplicate names gracefully', async () => {
      const memoryData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
      };

      const mockCreatedEntry = {
        id: 'test-id-1',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        firstMet: new Date(),
        lastSeen: new Date(),
        interactionCount: 0,
        introducedBy: null,
        notes: null,
        preferences: [],
        tags: [],
        relationshipType: 'friend',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.memoryEntry.create.mockResolvedValue(mockCreatedEntry);

      // Should allow duplicate names (different people can have same name)
      const result = await createMemoryEntry(memoryData);
      expect(result.id).toBeDefined();
    });
  });

  describe('findSimilarMemories', () => {
    it('should find memories with similarity above threshold', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const threshold = 0.8;

      const mockResults = [
        {
          id: 'memory-1',
          name: 'Anna',
          firstMet: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-01'),
          interactionCount: 0,
          introducedBy: null,
          notes: 'Friend',
          preferences: ['coffee'],
          tags: ['friend'],
          relationshipType: 'friend',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockPrisma.memoryEntry.findMany.mockResolvedValue(mockResults);

      // Mock the embedding store to return a similar embedding
      const { embeddingStore } = require('@/lib/memory-database');
      embeddingStore.set('memory-1', new Array(768).fill(0.1));

      const results = await findSimilarMemories(queryEmbedding, threshold);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBeGreaterThanOrEqual(threshold);
      expect(results[0].metadata.name).toBe('Anna');
    });

    it('should return empty array when no matches found', async () => {
      const queryEmbedding = new Array(768).fill(0.9); // Very different embedding
      const threshold = 0.8;

      mockPrisma.memoryEntry.findMany.mockResolvedValue([]);

      const results = await findSimilarMemories(queryEmbedding, threshold);

      expect(results).toEqual([]);
    });

    it('should respect top_k parameter', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      const topK = 3;

      const mockResults = Array.from({ length: 5 }, (_, i) => ({
        id: `memory-${i}`,
        name: `Person ${i}`,
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-01'),
        interactionCount: i,
        introducedBy: null,
        notes: null,
        preferences: [],
        tags: [],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }));

      mockPrisma.memoryEntry.findMany.mockResolvedValue(mockResults);

      // Mock the embedding store for all memories
      const { embeddingStore } = require('@/lib/memory-database');
      mockResults.forEach((memory, i) => {
        embeddingStore.set(memory.id, new Array(768).fill(0.1 + i * 0.01));
      });

      const results = await findSimilarMemories(queryEmbedding, 0.5, topK);

      expect(results.length).toBeLessThanOrEqual(topK);
    });
  });

  describe('updateMemoryEntry', () => {
    it('should update last_seen and interaction_count', async () => {
      const updates: UpdateMemoryEntryData = {
        lastSeen: new Date('2024-01-02'),
        interactionCount: 5,
        notes: 'Updated notes',
      };

      const mockUpdatedEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
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

      mockPrisma.memoryEntry.update.mockResolvedValue(mockUpdatedEntry);

      const result = await updateMemoryEntry('test-id', updates);

      expect(result.lastSeen).toEqual(updates.lastSeen);
      expect(result.interactionCount).toBe(5);
      expect(result.notes).toBe('Updated notes');
      expect(mockPrisma.memoryEntry.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updates,
      });
    });

    it('should preserve existing data when updating', async () => {
      const updates: UpdateMemoryEntryData = {
        interactionCount: 1,
      };

      const mockUpdatedEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
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

      mockPrisma.memoryEntry.update.mockResolvedValue(mockUpdatedEntry);

      const result = await updateMemoryEntry('test-id', updates);

      expect(result.name).toBe('Anna');
      expect(result.preferences).toEqual(['coffee']);
      expect(result.notes).toBe('Original notes');
    });
  });

  describe('createInteraction', () => {
    it('should create a new interaction record', async () => {
      const interactionData: CreateInteractionData = {
        memoryEntryId: 'memory-id',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
      };

      const mockCreatedInteraction = {
        id: 'interaction-id',
        memoryEntryId: 'memory-id',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
        createdAt: new Date('2024-01-01'),
      };

      mockPrisma.interaction.create.mockResolvedValue(mockCreatedInteraction);

      const result = await createInteraction(interactionData);

      expect(result.id).toBe('interaction-id');
      expect(result.memoryEntryId).toBe('memory-id');
      expect(result.interactionType).toBe('meeting');
      expect(result.context).toBe('First meeting');
      expect(result.responseGenerated).toBe('Nice to meet you!');
      expect(result.emotion).toBe('happy');
      expect(result.actions).toEqual(['wave', 'smile']);
    });
  });

  describe('getInteractionsForMemory', () => {
    it('should retrieve interactions for a memory entry', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          memoryEntryId: 'memory-id',
          interactionType: 'meeting',
          context: 'First meeting',
          responseGenerated: 'Hello!',
          emotion: 'happy',
          actions: ['wave'],
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'interaction-2',
          memoryEntryId: 'memory-id',
          interactionType: 'recognition',
          context: 'Recognized in crowd',
          responseGenerated: 'Hi Anna!',
          emotion: 'excited',
          actions: ['wave', 'smile'],
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockPrisma.interaction.findMany.mockResolvedValue(mockInteractions);

      const results = await getInteractionsForMemory('memory-id');

      expect(results).toHaveLength(2);
      expect(results[0].interactionType).toBe('meeting');
      expect(results[1].interactionType).toBe('recognition');
      expect(mockPrisma.interaction.findMany).toHaveBeenCalledWith({
        where: { memoryEntryId: 'memory-id' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('incrementInteractionCount', () => {
    it('should increment interaction count and update last seen', async () => {
      const mockUpdatedEntry = {
        id: 'memory-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        firstMet: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-02'),
        interactionCount: 6,
        introducedBy: 'Sang',
        notes: 'Friend',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.memoryEntry.update.mockResolvedValue(mockUpdatedEntry);

      await incrementInteractionCount('memory-id');

      expect(mockPrisma.memoryEntry.update).toHaveBeenCalledWith({
        where: { id: 'memory-id' },
        data: {
          interactionCount: {
            increment: 1,
          },
          lastSeen: expect.any(Date),
        },
      });
    });
  });
});
