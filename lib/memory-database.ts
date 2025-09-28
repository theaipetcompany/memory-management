import db from '@/lib/db';
import {
  MemoryEntry,
  InteractionRecord,
  SimilaritySearchResult,
  CreateMemoryEntryData,
  UpdateMemoryEntryData,
  CreateInteractionData,
  validateMemoryEntryData,
  SIMILARITY_THRESHOLD,
  MAX_SIMILARITY_RESULTS,
} from '@/types/memory';

// Using the existing db instance

// Store embeddings separately for now (we'll implement pgvector later)
export const embeddingStore = new Map<string, number[]>();

export async function createMemoryEntry(
  data: CreateMemoryEntryData
): Promise<MemoryEntry> {
  // Validate input data
  const errors = validateMemoryEntryData(data);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const memoryEntry = await db.memoryEntry.create({
    data: {
      name: data.name,
      introducedBy: data.introducedBy,
      notes: data.notes,
      preferences: data.preferences || [],
      tags: data.tags || [],
      relationshipType: data.relationshipType || 'friend',
    },
  });

  // Store embedding separately
  embeddingStore.set(memoryEntry.id, data.embedding);

  return {
    id: memoryEntry.id,
    name: memoryEntry.name,
    embedding: data.embedding,
    firstMet: memoryEntry.firstMet,
    lastSeen: memoryEntry.lastSeen,
    interactionCount: memoryEntry.interactionCount,
    introducedBy: memoryEntry.introducedBy || undefined,
    notes: memoryEntry.notes || undefined,
    preferences: memoryEntry.preferences,
    tags: memoryEntry.tags,
    relationshipType: memoryEntry.relationshipType as
      | 'friend'
      | 'family'
      | 'acquaintance',
    createdAt: memoryEntry.createdAt,
    updatedAt: memoryEntry.updatedAt,
  };
}

export async function findSimilarMemories(
  embedding: number[],
  threshold: number = SIMILARITY_THRESHOLD,
  topK: number = MAX_SIMILARITY_RESULTS
): Promise<SimilaritySearchResult[]> {
  // Get all memory entries
  const memoryEntries = await db.memoryEntry.findMany();

  // Calculate similarities
  const results: SimilaritySearchResult[] = [];

  for (const memoryEntry of memoryEntries) {
    const storedEmbedding = embeddingStore.get(memoryEntry.id);
    if (!storedEmbedding) continue;

    const similarity = calculateCosineSimilarity(embedding, storedEmbedding);

    if (similarity >= threshold) {
      results.push({
        id: memoryEntry.id,
        similarity,
        metadata: {
          id: memoryEntry.id,
          name: memoryEntry.name,
          embedding: storedEmbedding,
          firstMet: memoryEntry.firstMet,
          lastSeen: memoryEntry.lastSeen,
          interactionCount: memoryEntry.interactionCount,
          introducedBy: memoryEntry.introducedBy || undefined,
          notes: memoryEntry.notes || undefined,
          preferences: memoryEntry.preferences,
          tags: memoryEntry.tags,
          relationshipType: memoryEntry.relationshipType as
            | 'friend'
            | 'family'
            | 'acquaintance',
          createdAt: memoryEntry.createdAt,
          updatedAt: memoryEntry.updatedAt,
        },
      });
    }
  }

  // Sort by similarity and limit results
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

// Helper function to calculate cosine similarity
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function updateMemoryEntry(
  id: string,
  updates: UpdateMemoryEntryData
): Promise<MemoryEntry> {
  const memoryEntry = await db.memoryEntry.update({
    where: { id },
    data: {
      name: updates.name,
      lastSeen: updates.lastSeen,
      interactionCount: updates.interactionCount,
      introducedBy: updates.introducedBy,
      notes: updates.notes,
      preferences: updates.preferences,
      tags: updates.tags,
      relationshipType: updates.relationshipType,
    },
  });

  // Update embedding if provided
  if (updates.embedding) {
    embeddingStore.set(id, updates.embedding);
  }

  const storedEmbedding = embeddingStore.get(id) || [];

  return {
    id: memoryEntry.id,
    name: memoryEntry.name,
    embedding: storedEmbedding,
    firstMet: memoryEntry.firstMet,
    lastSeen: memoryEntry.lastSeen,
    interactionCount: memoryEntry.interactionCount,
    introducedBy: memoryEntry.introducedBy || undefined,
    notes: memoryEntry.notes || undefined,
    preferences: memoryEntry.preferences,
    tags: memoryEntry.tags,
    relationshipType: memoryEntry.relationshipType as
      | 'friend'
      | 'family'
      | 'acquaintance',
    createdAt: memoryEntry.createdAt,
    updatedAt: memoryEntry.updatedAt,
  };
}

export async function getMemoryEntry(id: string): Promise<MemoryEntry | null> {
  const memoryEntry = await db.memoryEntry.findUnique({
    where: { id },
  });

  if (!memoryEntry) {
    return null;
  }

  const storedEmbedding = embeddingStore.get(id) || [];

  return {
    id: memoryEntry.id,
    name: memoryEntry.name,
    embedding: storedEmbedding,
    firstMet: memoryEntry.firstMet,
    lastSeen: memoryEntry.lastSeen,
    interactionCount: memoryEntry.interactionCount,
    introducedBy: memoryEntry.introducedBy || undefined,
    notes: memoryEntry.notes || undefined,
    preferences: memoryEntry.preferences,
    tags: memoryEntry.tags,
    relationshipType: memoryEntry.relationshipType as
      | 'friend'
      | 'family'
      | 'acquaintance',
    createdAt: memoryEntry.createdAt,
    updatedAt: memoryEntry.updatedAt,
  };
}

export async function getAllMemoryEntries(): Promise<MemoryEntry[]> {
  const memoryEntries = await db.memoryEntry.findMany({
    orderBy: { lastSeen: 'desc' },
  });

  return memoryEntries.map((memoryEntry: any) => {
    const storedEmbedding = embeddingStore.get(memoryEntry.id) || [];

    return {
      id: memoryEntry.id,
      name: memoryEntry.name,
      embedding: storedEmbedding,
      firstMet: memoryEntry.firstMet,
      lastSeen: memoryEntry.lastSeen,
      interactionCount: memoryEntry.interactionCount,
      introducedBy: memoryEntry.introducedBy || undefined,
      notes: memoryEntry.notes || undefined,
      preferences: memoryEntry.preferences,
      tags: memoryEntry.tags,
      relationshipType: memoryEntry.relationshipType as
        | 'friend'
        | 'family'
        | 'acquaintance',
      createdAt: memoryEntry.createdAt,
      updatedAt: memoryEntry.updatedAt,
    };
  });
}

export async function deleteMemoryEntry(id: string): Promise<void> {
  await db.memoryEntry.delete({
    where: { id },
  });

  // Remove embedding from store
  embeddingStore.delete(id);
}

export async function createInteraction(
  data: CreateInteractionData
): Promise<InteractionRecord> {
  const interaction = await db.interaction.create({
    data: {
      memoryEntryId: data.memoryEntryId,
      interactionType: data.interactionType,
      context: data.context,
      responseGenerated: data.responseGenerated,
      emotion: data.emotion,
      actions: data.actions || [],
    },
  });

  return {
    id: interaction.id,
    memoryEntryId: interaction.memoryEntryId,
    interactionType: interaction.interactionType as
      | 'meeting'
      | 'recognition'
      | 'conversation',
    context: interaction.context || undefined,
    responseGenerated: interaction.responseGenerated || undefined,
    emotion: interaction.emotion || undefined,
    actions: interaction.actions,
    createdAt: interaction.createdAt,
  };
}

export async function getInteractionsForMemory(
  memoryEntryId: string
): Promise<InteractionRecord[]> {
  const interactions = await db.interaction.findMany({
    where: { memoryEntryId },
    orderBy: { createdAt: 'desc' },
  });

  return interactions.map((interaction: any) => ({
    id: interaction.id,
    memoryEntryId: interaction.memoryEntryId,
    interactionType: interaction.interactionType as
      | 'meeting'
      | 'recognition'
      | 'conversation',
    context: interaction.context || undefined,
    responseGenerated: interaction.responseGenerated || undefined,
    emotion: interaction.emotion || undefined,
    actions: interaction.actions,
    createdAt: interaction.createdAt,
  }));
}

export async function incrementInteractionCount(
  memoryEntryId: string
): Promise<void> {
  await db.memoryEntry.update({
    where: { id: memoryEntryId },
    data: {
      interactionCount: {
        increment: 1,
      },
      lastSeen: new Date(),
    },
  });
}
