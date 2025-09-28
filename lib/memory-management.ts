import {
  MemoryEntry,
  InteractionRecord,
  CreateInteractionData,
  CreateMemoryEntryData,
} from '@/types/memory';
import { OpenAIFaceEmbeddingService } from '@/lib/face-embedding';
import { SimilaritySearchService } from '@/lib/similarity-search';
import {
  createMemoryEntry,
  updateMemoryEntry,
  deleteMemoryEntry,
  getMemoryEntry,
  getAllMemoryEntries,
  createInteraction,
  incrementInteractionCount,
} from '@/lib/memory-database';

export interface CreateMemoryData {
  name: string;
  imageBuffer: Buffer;
  introducedBy?: string;
  notes?: string;
  preferences?: string[];
  tags?: string[];
  relationshipType?: 'friend' | 'family' | 'acquaintance';
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  relationshipTypes?: ('friend' | 'family' | 'acquaintance')[];
}

export interface RecognitionResult {
  recognized: boolean;
  memoryEntry?: MemoryEntry;
  confidence: number;
  similarMemories: Array<{
    id: string;
    similarity: number;
    metadata: MemoryEntry;
  }>;
}

export class MemoryManagementService {
  private faceEmbeddingService: OpenAIFaceEmbeddingService;
  private similaritySearchService: SimilaritySearchService;

  constructor() {
    this.faceEmbeddingService = new OpenAIFaceEmbeddingService();
    this.similaritySearchService = SimilaritySearchService;
  }

  /**
   * Create a new memory entry with face embedding
   */
  async createMemory(data: CreateMemoryData): Promise<MemoryEntry> {
    // Generate face embedding
    const embeddingResult = await this.faceEmbeddingService.generateEmbedding(
      data.imageBuffer
    );

    if (!embeddingResult.success || !embeddingResult.embedding) {
      throw new Error(
        embeddingResult.error || 'Failed to generate face embedding'
      );
    }

    // Create memory entry data
    const memoryData: CreateMemoryEntryData = {
      name: data.name,
      embedding: embeddingResult.embedding,
      introducedBy: data.introducedBy,
      notes: data.notes,
      preferences: data.preferences,
      tags: data.tags,
      relationshipType: data.relationshipType,
    };

    // Create memory entry in database
    return await createMemoryEntry(memoryData);
  }

  /**
   * Update an existing memory entry
   */
  async updateMemory(
    id: string,
    updates: Partial<MemoryEntry>
  ): Promise<MemoryEntry> {
    return await updateMemoryEntry(id, updates);
  }

  /**
   * Delete a memory entry
   */
  async deleteMemory(id: string): Promise<void> {
    await deleteMemoryEntry(id);
  }

  /**
   * Get a specific memory entry by ID
   */
  async getMemory(id: string): Promise<MemoryEntry | null> {
    return await getMemoryEntry(id);
  }

  /**
   * List all memory entries with optional filtering
   */
  async listMemories(options: ListOptions = {}): Promise<MemoryEntry[]> {
    const memories = await getAllMemoryEntries();

    // Apply relationship type filter if specified
    if (options.relationshipTypes && options.relationshipTypes.length > 0) {
      return memories.filter((memory) =>
        options.relationshipTypes!.includes(memory.relationshipType)
      );
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || memories.length;

    return memories.slice(offset, offset + limit);
  }

  /**
   * Record an interaction with a memory entry
   */
  async recordInteraction(
    data: CreateInteractionData
  ): Promise<InteractionRecord> {
    // Create interaction record
    const interaction = await createInteraction(data);

    // Increment interaction count
    await incrementInteractionCount(data.memoryEntryId);

    return interaction;
  }

  /**
   * Recognize a face from an image and find matching memories
   */
  async recognizeFace(
    imageBuffer: Buffer,
    threshold: number = 0.75
  ): Promise<RecognitionResult> {
    // Generate face embedding
    const embeddingResult = await this.faceEmbeddingService.generateEmbedding(
      imageBuffer
    );

    if (!embeddingResult.success || !embeddingResult.embedding) {
      throw new Error(
        embeddingResult.error || 'Failed to generate face embedding'
      );
    }

    // Find similar memories
    const similarMemories = await this.similaritySearchService.findSimilarFaces(
      embeddingResult.embedding,
      { threshold, topK: 10 }
    );

    // Check if we have a match above threshold
    const bestMatch = similarMemories.length > 0 ? similarMemories[0] : null;
    const recognized = bestMatch ? bestMatch.similarity >= threshold : false;

    return {
      recognized,
      memoryEntry: recognized ? bestMatch!.metadata : undefined,
      confidence: bestMatch?.similarity || 0,
      similarMemories,
    };
  }

  /**
   * Get interaction history for a memory entry
   */
  async getInteractionHistory(memoryId: string): Promise<InteractionRecord[]> {
    // This would need to be implemented in the database service
    // For now, return empty array
    return [];
  }

  /**
   * Search memories by name or tags
   */
  async searchMemories(query: string): Promise<MemoryEntry[]> {
    const memories = await getAllMemoryEntries();

    const searchTerm = query.toLowerCase();

    return memories.filter(
      (memory) =>
        memory.name.toLowerCase().includes(searchTerm) ||
        memory.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
        (memory.notes && memory.notes.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<{
    totalMemories: number;
    totalInteractions: number;
    relationshipTypeCounts: Record<string, number>;
    averageInteractionsPerMemory: number;
  }> {
    const memories = await getAllMemoryEntries();

    const totalMemories = memories.length;
    const totalInteractions = memories.reduce(
      (sum, memory) => sum + memory.interactionCount,
      0
    );

    const relationshipTypeCounts = memories.reduce((counts, memory) => {
      counts[memory.relationshipType] =
        (counts[memory.relationshipType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const averageInteractionsPerMemory =
      totalMemories > 0 ? totalInteractions / totalMemories : 0;

    return {
      totalMemories,
      totalInteractions,
      relationshipTypeCounts,
      averageInteractionsPerMemory,
    };
  }
}
