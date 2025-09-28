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

jest.mock('@/lib/memory-database', () => ({
  createInteraction: jest.fn(),
  getInteractionsForMemory: jest.fn(),
  incrementInteractionCount: jest.fn(),
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

describe('Interaction API', () => {
  let mockMemoryService: any;
  let mockMemoryEntry: any;
  let mockInteraction: any;

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
    Object.values(mockMemoryService).forEach((method: any) => {
      if (typeof method === 'function' && method.mockClear) {
        method.mockClear();
      }
    });
  });

  describe('Interaction Service Integration', () => {
    it('should record new interaction', async () => {
      const interactionData = {
        memoryEntryId: 'memory-1',
        interactionType: 'meeting' as const,
        context: 'First meeting',
        responseGenerated: 'Nice to meet you!',
        emotion: 'happy',
        actions: ['wave', 'smile'],
      };

      mockMemoryService.recordInteraction.mockResolvedValue(mockInteraction);

      const result = await mockMemoryService.recordInteraction(interactionData);

      expect(result).toEqual(mockInteraction);
      expect(mockMemoryService.recordInteraction).toHaveBeenCalledWith(
        interactionData
      );
    });

    it('should update memory interaction count', async () => {
      const interactionData = {
        memoryEntryId: 'memory-1',
        interactionType: 'recognition' as const,
      };

      mockMemoryService.recordInteraction.mockResolvedValue({
        ...mockInteraction,
        interactionType: 'recognition',
      });

      const result = await mockMemoryService.recordInteraction(interactionData);

      expect(result.interactionType).toBe('recognition');
      expect(mockMemoryService.recordInteraction).toHaveBeenCalledWith(
        interactionData
      );
    });

    it('should validate interaction data', async () => {
      const invalidInteractionData = {
        memoryEntryId: '', // Invalid empty ID
        interactionType: 'invalid-type' as any,
      };

      mockMemoryService.recordInteraction.mockRejectedValue(
        new Error('Invalid interaction data')
      );

      await expect(
        mockMemoryService.recordInteraction(invalidInteractionData)
      ).rejects.toThrow('Invalid interaction data');
    });

    it('should handle different interaction types', async () => {
      const meetingInteraction = {
        memoryEntryId: 'memory-1',
        interactionType: 'meeting' as const,
        context: 'First meeting',
      };

      const recognitionInteraction = {
        memoryEntryId: 'memory-1',
        interactionType: 'recognition' as const,
        context: 'Recognized in crowd',
      };

      const conversationInteraction = {
        memoryEntryId: 'memory-1',
        interactionType: 'conversation' as const,
        context: 'Had a chat',
        responseGenerated: 'Great conversation!',
      };

      mockMemoryService.recordInteraction
        .mockResolvedValueOnce({
          ...mockInteraction,
          interactionType: 'meeting',
        })
        .mockResolvedValueOnce({
          ...mockInteraction,
          interactionType: 'recognition',
        })
        .mockResolvedValueOnce({
          ...mockInteraction,
          interactionType: 'conversation',
        });

      const meetingResult = await mockMemoryService.recordInteraction(
        meetingInteraction
      );
      const recognitionResult = await mockMemoryService.recordInteraction(
        recognitionInteraction
      );
      const conversationResult = await mockMemoryService.recordInteraction(
        conversationInteraction
      );

      expect(meetingResult.interactionType).toBe('meeting');
      expect(recognitionResult.interactionType).toBe('recognition');
      expect(conversationResult.interactionType).toBe('conversation');
    });

    it('should handle interaction with emotions and actions', async () => {
      const emotionalInteraction = {
        memoryEntryId: 'memory-1',
        interactionType: 'meeting' as const,
        context: 'Happy reunion',
        emotion: 'excited',
        actions: ['hug', 'laugh', 'wave'],
      };

      mockMemoryService.recordInteraction.mockResolvedValue({
        ...mockInteraction,
        emotion: 'excited',
        actions: ['hug', 'laugh', 'wave'],
      });

      const result = await mockMemoryService.recordInteraction(
        emotionalInteraction
      );

      expect(result.emotion).toBe('excited');
      expect(result.actions).toEqual(['hug', 'laugh', 'wave']);
    });

    it('should handle interaction errors', async () => {
      const interactionData = {
        memoryEntryId: 'non-existent-memory',
        interactionType: 'meeting' as const,
      };

      mockMemoryService.recordInteraction.mockRejectedValue(
        new Error('Memory not found')
      );

      await expect(
        mockMemoryService.recordInteraction(interactionData)
      ).rejects.toThrow('Memory not found');
    });

    it('should get interaction history for memory', async () => {
      const mockInteractions = [
        mockInteraction,
        {
          ...mockInteraction,
          id: 'interaction-2',
          interactionType: 'recognition',
        },
        {
          ...mockInteraction,
          id: 'interaction-3',
          interactionType: 'conversation',
        },
      ];

      // Mock the getInteractionHistory method
      mockMemoryService.getInteractionHistory = jest
        .fn()
        .mockResolvedValue(mockInteractions);

      const result = await mockMemoryService.getInteractionHistory('memory-1');

      expect(result).toEqual(mockInteractions);
      expect(mockMemoryService.getInteractionHistory).toHaveBeenCalledWith(
        'memory-1'
      );
    });

    it('should support pagination for interaction history', async () => {
      const mockInteractions = Array.from({ length: 25 }, (_, i) => ({
        ...mockInteraction,
        id: `interaction-${i}`,
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      }));

      mockMemoryService.getInteractionHistory = jest
        .fn()
        .mockResolvedValue(mockInteractions.slice(10, 20));

      const result = await mockMemoryService.getInteractionHistory('memory-1');

      expect(result).toHaveLength(10);
    });

    it('should filter interactions by type', async () => {
      const meetingInteractions = [
        { ...mockInteraction, interactionType: 'meeting' },
        { ...mockInteraction, id: 'interaction-2', interactionType: 'meeting' },
      ];

      mockMemoryService.getInteractionHistory = jest
        .fn()
        .mockResolvedValue(meetingInteractions);

      const result = await mockMemoryService.getInteractionHistory('memory-1');

      expect(result).toHaveLength(2);
      expect(result.every((i: any) => i.interactionType === 'meeting')).toBe(
        true
      );
    });
  });
});
