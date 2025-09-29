/**
 * Tests for memory types and validation
 * Following TDD principles with comprehensive type validation
 */

import {
  MemoryEntry,
  InteractionRecord,
  SimilaritySearchResult,
  CreateMemoryEntryData,
  UpdateMemoryEntryData,
  CreateInteractionData,
  validateEmbedding,
  validateMemoryEntryData,
  validateInteractionData,
  EMBEDDING_DIMENSION,
  SIMILARITY_THRESHOLD,
  MAX_SEARCH_RESULTS,
} from '@/types/memory';

describe('Memory Types', () => {
  describe('MemoryEntry interface', () => {
    it('should have all required fields', () => {
      const memory: MemoryEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
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
      expect(memory.embedding).toHaveLength(EMBEDDING_DIMENSION);
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

    it('should allow optional fields to be undefined', () => {
      const memory: MemoryEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        firstMet: new Date(),
        lastSeen: new Date(),
        interactionCount: 0,
        introducedBy: undefined,
        notes: undefined,
        preferences: [],
        tags: [],
        relationshipType: 'friend',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(memory.introducedBy).toBeUndefined();
      expect(memory.notes).toBeUndefined();
    });

    it('should validate relationship type values', () => {
      const validTypes: Array<'friend' | 'family' | 'acquaintance'> = [
        'friend',
        'family',
        'acquaintance',
      ];

      validTypes.forEach((type) => {
        const memory: MemoryEntry = {
          id: 'test-id',
          name: 'Anna',
          embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
          firstMet: new Date(),
          lastSeen: new Date(),
          interactionCount: 0,
          preferences: [],
          tags: [],
          relationshipType: type,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(memory.relationshipType).toBe(type);
      });
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
      expect(['meeting', 'recognition', 'conversation']).toContain(
        interaction.interactionType
      );
      expect(interaction.context).toBeDefined();
      expect(interaction.responseGenerated).toBeDefined();
      expect(interaction.emotion).toBeDefined();
      expect(Array.isArray(interaction.actions)).toBe(true);
      expect(interaction.createdAt).toBeInstanceOf(Date);
    });

    it('should allow optional fields to be undefined', () => {
      const interaction: InteractionRecord = {
        id: 'test-id',
        memoryEntryId: 'memory-id',
        interactionType: 'meeting',
        context: undefined,
        responseGenerated: undefined,
        emotion: undefined,
        actions: [],
        createdAt: new Date(),
      };

      expect(interaction.context).toBeUndefined();
      expect(interaction.responseGenerated).toBeUndefined();
      expect(interaction.emotion).toBeUndefined();
    });

    it('should validate interaction type values', () => {
      const validTypes: Array<'meeting' | 'recognition' | 'conversation'> = [
        'meeting',
        'recognition',
        'conversation',
      ];

      validTypes.forEach((type) => {
        const interaction: InteractionRecord = {
          id: 'test-id',
          memoryEntryId: 'memory-id',
          interactionType: type,
          actions: [],
          createdAt: new Date(),
        };

        expect(interaction.interactionType).toBe(type);
      });
    });
  });

  describe('SimilaritySearchResult interface', () => {
    it('should contain similarity score and metadata', () => {
      const memory: MemoryEntry = {
        id: 'test-id',
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
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

      expect(result.id).toBeDefined();
      expect(typeof result.similarity).toBe('number');
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
      expect(result.metadata).toEqual(memory);
    });
  });

  describe('CreateMemoryEntryData interface', () => {
    it('should have required fields for creating memory entries', () => {
      const data: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        introducedBy: 'Sang',
        notes: 'Met at party',
        preferences: ['coffee'],
        tags: ['friend'],
        relationshipType: 'friend',
      };

      expect(data.name).toBeDefined();
      expect(data.embedding).toHaveLength(EMBEDDING_DIMENSION);
      expect(data.introducedBy).toBeDefined();
      expect(data.notes).toBeDefined();
      expect(Array.isArray(data.preferences)).toBe(true);
      expect(Array.isArray(data.tags)).toBe(true);
      expect(data.relationshipType).toBe('friend');
    });

    it('should allow optional fields to be undefined', () => {
      const data: CreateMemoryEntryData = {
        name: 'Anna',
        embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
      };

      expect(data.introducedBy).toBeUndefined();
      expect(data.notes).toBeUndefined();
      expect(data.preferences).toBeUndefined();
      expect(data.tags).toBeUndefined();
      expect(data.relationshipType).toBeUndefined();
    });
  });

  describe('UpdateMemoryEntryData interface', () => {
    it('should allow partial updates', () => {
      const updates: UpdateMemoryEntryData = {
        name: 'Anna Updated',
        interactionCount: 5,
        notes: 'Updated notes',
      };

      expect(updates.name).toBe('Anna Updated');
      expect(updates.interactionCount).toBe(5);
      expect(updates.notes).toBe('Updated notes');
    });

    it('should allow all fields to be optional', () => {
      const updates: UpdateMemoryEntryData = {};

      expect(Object.keys(updates)).toHaveLength(0);
    });
  });

  describe('CreateInteractionData interface', () => {
    it('should have required fields for creating interactions', () => {
      const data: CreateInteractionData = {
        memoryEntryId: 'memory-id',
        interactionType: 'meeting',
        context: 'First meeting',
        responseGenerated: 'Hello!',
        emotion: 'happy',
        actions: ['wave'],
      };

      expect(data.memoryEntryId).toBeDefined();
      expect(data.interactionType).toBe('meeting');
      expect(data.context).toBeDefined();
      expect(data.responseGenerated).toBeDefined();
      expect(data.emotion).toBeDefined();
      expect(Array.isArray(data.actions)).toBe(true);
    });

    it('should allow optional fields to be undefined', () => {
      const data: CreateInteractionData = {
        memoryEntryId: 'memory-id',
        interactionType: 'meeting',
      };

      expect(data.context).toBeUndefined();
      expect(data.responseGenerated).toBeUndefined();
      expect(data.emotion).toBeUndefined();
      expect(data.actions).toBeUndefined();
    });
  });

  describe('Constants', () => {
    it('should have correct embedding dimension', () => {
      expect(EMBEDDING_DIMENSION).toBe(768);
    });

    it('should have reasonable similarity threshold', () => {
      expect(SIMILARITY_THRESHOLD).toBe(0.8);
      expect(SIMILARITY_THRESHOLD).toBeGreaterThan(0);
      expect(SIMILARITY_THRESHOLD).toBeLessThanOrEqual(1);
    });

    it('should have reasonable max search results', () => {
      expect(MAX_SEARCH_RESULTS).toBe(10);
      expect(MAX_SEARCH_RESULTS).toBeGreaterThan(0);
    });
  });

  describe('Validation Functions', () => {
    describe('validateEmbedding', () => {
      it('should validate correct embedding dimensions', () => {
        const validEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.1);
        expect(validateEmbedding(validEmbedding)).toBe(true);
      });

      it('should reject incorrect embedding dimensions', () => {
        const invalidEmbedding = new Array(100).fill(0.1);
        expect(validateEmbedding(invalidEmbedding)).toBe(false);
      });

      it('should reject non-array inputs', () => {
        expect(validateEmbedding(null as any)).toBe(false);
        expect(validateEmbedding(undefined as any)).toBe(false);
        expect(validateEmbedding('not an array' as any)).toBe(false);
        expect(validateEmbedding({} as any)).toBe(false);
      });

      it('should reject empty arrays', () => {
        expect(validateEmbedding([])).toBe(false);
      });
    });

    describe('validateMemoryEntryData', () => {
      it('should validate correct memory entry data', () => {
        const validData: CreateMemoryEntryData = {
          name: 'Anna',
          embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
          relationshipType: 'friend',
        };

        expect(() => validateMemoryEntryData(validData)).not.toThrow();
      });

      it('should reject empty name', () => {
        const invalidData = {
          name: '',
          embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        };

        expect(() => validateMemoryEntryData(invalidData)).toThrow(
          'Name is required'
        );
      });

      it('should reject whitespace-only name', () => {
        const invalidData = {
          name: '   ',
          embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
        };

        expect(() => validateMemoryEntryData(invalidData)).toThrow(
          'Name is required'
        );
      });

      it('should reject invalid embedding dimensions', () => {
        const invalidData = {
          name: 'Anna',
          embedding: new Array(100).fill(0.1),
        };

        expect(() => validateMemoryEntryData(invalidData)).toThrow(
          `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
        );
      });

      it('should reject invalid relationship type', () => {
        const invalidData = {
          name: 'Anna',
          embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
          relationshipType: 'invalid' as any,
        };

        expect(() => validateMemoryEntryData(invalidData)).toThrow(
          'Invalid relationship type'
        );
      });

      it('should accept valid relationship types', () => {
        const validTypes: Array<'friend' | 'family' | 'acquaintance'> = [
          'friend',
          'family',
          'acquaintance',
        ];

        validTypes.forEach((type) => {
          const validData = {
            name: 'Anna',
            embedding: new Array(EMBEDDING_DIMENSION).fill(0.1),
            relationshipType: type,
          };

          expect(() => validateMemoryEntryData(validData)).not.toThrow();
        });
      });
    });

    describe('validateInteractionData', () => {
      it('should validate correct interaction data', () => {
        const validData: CreateInteractionData = {
          memoryEntryId: 'memory-id',
          interactionType: 'meeting',
        };

        expect(() => validateInteractionData(validData)).not.toThrow();
      });

      it('should reject empty memory entry ID', () => {
        const invalidData = {
          memoryEntryId: '',
          interactionType: 'meeting' as
            | 'meeting'
            | 'recognition'
            | 'conversation',
        };

        expect(() => validateInteractionData(invalidData)).toThrow(
          'Memory entry ID is required'
        );
      });

      it('should reject whitespace-only memory entry ID', () => {
        const invalidData = {
          memoryEntryId: '   ',
          interactionType: 'meeting' as
            | 'meeting'
            | 'recognition'
            | 'conversation',
        };

        expect(() => validateInteractionData(invalidData)).toThrow(
          'Memory entry ID is required'
        );
      });

      it('should reject invalid interaction type', () => {
        const invalidData = {
          memoryEntryId: 'memory-id',
          interactionType: 'invalid' as
            | 'meeting'
            | 'recognition'
            | 'conversation',
        };

        expect(() => validateInteractionData(invalidData)).toThrow(
          'Invalid interaction type'
        );
      });

      it('should accept valid interaction types', () => {
        const validTypes: Array<'meeting' | 'recognition' | 'conversation'> = [
          'meeting',
          'recognition',
          'conversation',
        ];

        validTypes.forEach((type) => {
          const validData = {
            memoryEntryId: 'memory-id',
            interactionType: type,
          };

          expect(() => validateInteractionData(validData)).not.toThrow();
        });
      });
    });
  });
});
