import {
  MemoryEntry,
  InteractionRecord,
  SimilaritySearchResult,
  CreateMemoryEntryData,
  validateEmbedding,
  validateMemoryEntryData,
  EMBEDDING_DIMENSION,
} from '@/types/memory';

describe('Memory Types', () => {
  describe('MemoryEntry interface', () => {
    it('should have all required fields', () => {
      const memory: MemoryEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        firstMet: new Date(),
        lastSeen: new Date(),
        interactionCount: 0,
        preferences: [],
        tags: [],
        relationshipType: 'friend',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(memory.id).toBeDefined();
      expect(memory.name).toBeDefined();
      expect(memory.embedding).toHaveLength(768);
      expect(memory.firstMet).toBeInstanceOf(Date);
      expect(memory.lastSeen).toBeInstanceOf(Date);
      expect(typeof memory.interactionCount).toBe('number');
      expect(Array.isArray(memory.preferences)).toBe(true);
      expect(Array.isArray(memory.tags)).toBe(true);
      expect(['friend', 'family', 'acquaintance']).toContain(
        memory.relationshipType
      );
      expect(memory.createdAt).toBeInstanceOf(Date);
      expect(memory.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const memory: MemoryEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        firstMet: new Date(),
        lastSeen: new Date(),
        interactionCount: 0,
        introducedBy: 'Sang',
        notes: 'Met at coffee shop',
        preferences: ['coffee', 'books'],
        tags: ['friend', 'new_person'],
        relationshipType: 'friend',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(memory.introducedBy).toBe('Sang');
      expect(memory.notes).toBe('Met at coffee shop');
      expect(memory.preferences).toEqual(['coffee', 'books']);
      expect(memory.tags).toEqual(['friend', 'new_person']);
    });
  });

  describe('InteractionRecord interface', () => {
    it('should track interaction metadata', () => {
      const interaction: InteractionRecord = {
        id: 'test-id',
        memoryEntryId: 'memory-id',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
        createdAt: new Date(),
      };

      expect(interaction.id).toBeDefined();
      expect(interaction.memoryEntryId).toBeDefined();
      expect(interaction.interactionType).toBe('meeting');
      expect(interaction.context).toBe('First meeting');
      expect(interaction.responseGenerated).toBe('Nice to meet you!');
      expect(interaction.emotion).toBe('happy');
      expect(Array.isArray(interaction.actions)).toBe(true);
      expect(interaction.createdAt).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const interaction: InteractionRecord = {
        id: 'test-id',
        memoryEntryId: 'memory-id',
        interactionType: 'recognition',
        actions: [],
        createdAt: new Date(),
      };

      expect(interaction.context).toBeUndefined();
      expect(interaction.responseGenerated).toBeUndefined();
      expect(interaction.emotion).toBeUndefined();
      expect(interaction.actions).toEqual([]);
    });
  });

  describe('SimilaritySearchResult interface', () => {
    it('should contain similarity score and metadata', () => {
      const memory: MemoryEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(768).fill(0.1),
        firstMet: new Date(),
        lastSeen: new Date(),
        interactionCount: 0,
        preferences: [],
        tags: [],
        relationshipType: 'friend',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result: SimilaritySearchResult = {
        id: 'test-id',
        similarity: 0.95,
        metadata: memory,
      };

      expect(result.id).toBe('test-id');
      expect(result.similarity).toBe(0.95);
      expect(result.metadata).toEqual(memory);
    });
  });

  describe('validateEmbedding', () => {
    it('should validate correct embedding dimensions', () => {
      const validEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.1);
      expect(validateEmbedding(validEmbedding)).toBe(true);
    });

    it('should reject wrong dimensions', () => {
      const invalidEmbedding = new Array(100).fill(0.1);
      expect(validateEmbedding(invalidEmbedding)).toBe(false);
    });

    it('should reject non-numeric values', () => {
      const invalidEmbedding = new Array(EMBEDDING_DIMENSION).fill('invalid');
      expect(validateEmbedding(invalidEmbedding as any)).toBe(false);
    });

    it('should reject NaN values', () => {
      const invalidEmbedding = new Array(EMBEDDING_DIMENSION).fill(NaN);
      expect(validateEmbedding(invalidEmbedding)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateEmbedding(null as any)).toBe(false);
      expect(validateEmbedding(undefined as any)).toBe(false);
    });
  });

  describe('validateMemoryEntryData', () => {
    it('should validate correct data', () => {
      const validData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
      };

      const errors = validateMemoryEntryData(validData);
      expect(errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const invalidData: CreateMemoryEntryData = {
        name: '',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
      };

      const errors = validateMemoryEntryData(invalidData);
      expect(errors).toContain('Name is required');
    });

    it('should reject whitespace-only name', () => {
      const invalidData: CreateMemoryEntryData = {
        name: '   ',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
      };

      const errors = validateMemoryEntryData(invalidData);
      expect(errors).toContain('Name is required');
    });

    it('should reject invalid embedding', () => {
      const invalidData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(100).fill(0.1),
      };

      const errors = validateMemoryEntryData(invalidData);
      expect(errors).toContain(
        `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
      );
    });

    it('should reject non-array preferences', () => {
      const invalidData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        preferences: 'coffee' as any,
      };

      const errors = validateMemoryEntryData(invalidData);
      expect(errors).toContain('Preferences must be an array');
    });

    it('should reject non-array tags', () => {
      const invalidData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        tags: 'friend' as any,
      };

      const errors = validateMemoryEntryData(invalidData);
      expect(errors).toContain('Tags must be an array');
    });

    it('should reject invalid relationship type', () => {
      const invalidData: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        relationshipType: 'stranger' as any,
      };

      const errors = validateMemoryEntryData(invalidData);
      expect(errors).toContain(
        'Relationship type must be friend, family, or acquaintance'
      );
    });

    it('should accept valid relationship types', () => {
      const validTypes: Array<'friend' | 'family' | 'acquaintance'> = [
        'friend',
        'family',
        'acquaintance',
      ];

      validTypes.forEach((type) => {
        const data: CreateMemoryEntryData = {
          name: 'Anna',
          embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
          relationshipType: type,
        };

        const errors = validateMemoryEntryData(data);
        expect(errors).not.toContain(
          'Relationship type must be friend, family, or acquaintance'
        );
      });
    });

    it('should return multiple errors for multiple issues', () => {
      const invalidData: CreateMemoryEntryData = {
        name: '',
        embedding: new Array(100).fill(0.1),
        preferences: 'coffee' as any,
        relationshipType: 'stranger' as any,
      };

      const errors = validateMemoryEntryData(invalidData);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('Name is required');
      expect(errors).toContain(
        `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
      );
      expect(errors).toContain('Preferences must be an array');
      expect(errors).toContain(
        'Relationship type must be friend, family, or acquaintance'
      );
    });
  });
});
