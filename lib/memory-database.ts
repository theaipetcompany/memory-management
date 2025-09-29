/**
 * Memory database service with pgvector operations
 * Handles all database operations for the AI Pet Memory system
 */

import { PrismaClient } from '@/lib/prisma/client';
import {
  MemoryEntry,
  InteractionRecord,
  SimilaritySearchResult,
  CreateMemoryEntryData,
  UpdateMemoryEntryData,
  CreateInteractionData,
  validateMemoryEntryData,
  validateInteractionData,
  EMBEDDING_DIMENSION,
} from '@/types/memory';

const prisma = new PrismaClient();

/**
 * Create a new memory entry with embedding
 */
export async function createMemoryEntry(
  data: CreateMemoryEntryData
): Promise<MemoryEntry> {
  validateMemoryEntryData(data);

  const memoryEntry = await prisma.memoryEntry.create({
    data: {
      name: data.name,
      embedding: JSON.stringify(data.embedding), // Store as JSON string
      introducedBy: data.introducedBy,
      notes: data.notes,
      preferences: data.preferences || [],
      tags: data.tags || [],
      relationshipType: data.relationshipType || 'friend',
    },
  });

  return {
    id: memoryEntry.id,
    name: memoryEntry.name,
    embedding: JSON.parse(memoryEntry.embedding) as number[],
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

/**
 * Find similar memories using cosine similarity with pgvector
 * Note: This is a simplified version that works with JSON string embeddings
 * In production, you would use raw SQL queries with pgvector operators
 */
export async function findSimilarMemories(
  embedding: number[],
  threshold: number = 0.8,
  topK: number = 10
): Promise<SimilaritySearchResult[]> {
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
    );
  }

  // For now, get all memories and calculate similarity in JavaScript
  // In production, this would use pgvector SQL queries
  const allMemories = await prisma.memoryEntry.findMany();

  const results: SimilaritySearchResult[] = [];

  for (const memory of allMemories) {
    const memoryEmbedding = JSON.parse(memory.embedding) as number[];
    const similarity = calculateCosineSimilarity(embedding, memoryEmbedding);

    if (similarity >= threshold) {
      results.push({
        id: memory.id,
        similarity,
        metadata: {
          id: memory.id,
          name: memory.name,
          embedding: memoryEmbedding,
          firstMet: memory.firstMet,
          lastSeen: memory.lastSeen,
          interactionCount: memory.interactionCount,
          introducedBy: memory.introducedBy || undefined,
          notes: memory.notes || undefined,
          preferences: memory.preferences,
          tags: memory.tags,
          relationshipType: memory.relationshipType as
            | 'friend'
            | 'family'
            | 'acquaintance',
          createdAt: memory.createdAt,
          updatedAt: memory.updatedAt,
        },
      });
    }
  }

  // Sort by similarity (highest first) and limit results
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Update an existing memory entry
 */
export async function updateMemoryEntry(
  id: string,
  updates: UpdateMemoryEntryData
): Promise<MemoryEntry> {
  if (
    (updates.embedding && !Array.isArray(updates.embedding)) ||
    updates.embedding?.length !== EMBEDDING_DIMENSION
  ) {
    throw new Error(
      `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
    );
  }

  const updatedEntry = await prisma.memoryEntry.update({
    where: { id },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.embedding && {
        embedding: JSON.stringify(updates.embedding),
      }),
      ...(updates.lastSeen && { lastSeen: updates.lastSeen }),
      ...(updates.interactionCount !== undefined && {
        interactionCount: updates.interactionCount,
      }),
      ...(updates.introducedBy !== undefined && {
        introducedBy: updates.introducedBy,
      }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.preferences && { preferences: updates.preferences }),
      ...(updates.tags && { tags: updates.tags }),
      ...(updates.relationshipType && {
        relationshipType: updates.relationshipType,
      }),
    },
  });

  return {
    id: updatedEntry.id,
    name: updatedEntry.name,
    embedding: JSON.parse(updatedEntry.embedding) as number[],
    firstMet: updatedEntry.firstMet,
    lastSeen: updatedEntry.lastSeen,
    interactionCount: updatedEntry.interactionCount,
    introducedBy: updatedEntry.introducedBy || undefined,
    notes: updatedEntry.notes || undefined,
    preferences: updatedEntry.preferences,
    tags: updatedEntry.tags,
    relationshipType: updatedEntry.relationshipType as
      | 'friend'
      | 'family'
      | 'acquaintance',
    createdAt: updatedEntry.createdAt,
    updatedAt: updatedEntry.updatedAt,
  };
}

/**
 * Get a memory entry by ID
 */
export async function getMemoryEntry(id: string): Promise<MemoryEntry | null> {
  const memoryEntry = await prisma.memoryEntry.findUnique({
    where: { id },
  });

  if (!memoryEntry) {
    return null;
  }

  return {
    id: memoryEntry.id,
    name: memoryEntry.name,
    embedding: JSON.parse(memoryEntry.embedding) as number[],
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

/**
 * Get all memory entries
 */
export async function getAllMemoryEntries(): Promise<MemoryEntry[]> {
  const memoryEntries = await prisma.memoryEntry.findMany({
    orderBy: { lastSeen: 'desc' },
  });

  return memoryEntries.map((memoryEntry) => ({
    id: memoryEntry.id,
    name: memoryEntry.name,
    embedding: JSON.parse(memoryEntry.embedding) as number[],
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
  }));
}

/**
 * Delete a memory entry
 */
export async function deleteMemoryEntry(id: string): Promise<void> {
  await prisma.memoryEntry.delete({
    where: { id },
  });
}

/**
 * Create a new interaction record
 */
export async function createInteraction(
  data: CreateInteractionData
): Promise<InteractionRecord> {
  validateInteractionData(data);

  const interaction = await prisma.interaction.create({
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

/**
 * Get interactions for a specific memory entry
 */
export async function getInteractionsByMemoryId(
  memoryEntryId: string
): Promise<InteractionRecord[]> {
  const interactions = await prisma.interaction.findMany({
    where: { memoryEntryId },
    orderBy: { createdAt: 'desc' },
  });

  return interactions.map((interaction) => ({
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

/**
 * Update interaction count for a memory entry
 */
export async function incrementInteractionCount(
  memoryEntryId: string
): Promise<void> {
  await prisma.memoryEntry.update({
    where: { id: memoryEntryId },
    data: {
      interactionCount: {
        increment: 1,
      },
      lastSeen: new Date(),
    },
  });
}

/**
 * Search memories by name (case-insensitive)
 */
export async function searchMemoriesByName(
  name: string
): Promise<MemoryEntry[]> {
  const memoryEntries = await prisma.memoryEntry.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
    orderBy: { lastSeen: 'desc' },
  });

  return memoryEntries.map((memoryEntry) => ({
    id: memoryEntry.id,
    name: memoryEntry.name,
    embedding: JSON.parse(memoryEntry.embedding) as number[],
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
  }));
}
