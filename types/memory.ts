/**
 * Core types and interfaces for the AI Pet Memory system
 */

export interface MemoryEntry {
  id: string;
  name: string;
  embedding: number[]; // 768-dimensional vector from OpenAI vision API
  firstMet: Date;
  lastSeen: Date;
  interactionCount: number;
  introducedBy?: string;
  notes?: string;
  preferences: string[];
  tags: string[];
  relationshipType: 'friend' | 'family' | 'acquaintance';
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionRecord {
  id: string;
  memoryEntryId: string;
  interactionType: 'meeting' | 'recognition' | 'conversation';
  context?: string;
  responseGenerated?: string;
  emotion?: string;
  actions: string[];
  createdAt: Date;
}

export interface SimilaritySearchResult {
  id: string;
  similarity: number;
  metadata: MemoryEntry;
}

export interface CreateMemoryEntryData {
  name: string;
  embedding: number[];
  introducedBy?: string;
  notes?: string;
  preferences?: string[];
  tags?: string[];
  relationshipType?: 'friend' | 'family' | 'acquaintance';
}

export interface UpdateMemoryEntryData {
  name?: string;
  embedding?: number[];
  lastSeen?: Date;
  interactionCount?: number;
  introducedBy?: string;
  notes?: string;
  preferences?: string[];
  tags?: string[];
  relationshipType?: 'friend' | 'family' | 'acquaintance';
}

export interface CreateInteractionData {
  memoryEntryId: string;
  interactionType: 'meeting' | 'recognition' | 'conversation';
  context?: string;
  responseGenerated?: string;
  emotion?: string;
  actions?: string[];
}

// Constants for embedding dimensions
export const EMBEDDING_DIMENSION = 768; // OpenAI vision API embedding dimension
export const SIMILARITY_THRESHOLD = 0.8; // Default similarity threshold for recognition
export const MAX_SEARCH_RESULTS = 10; // Default maximum number of search results

// Validation helpers
export function validateEmbedding(embedding: number[]): boolean {
  return Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSION;
}

export function validateMemoryEntryData(data: CreateMemoryEntryData): void {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Name is required');
  }

  if (!validateEmbedding(data.embedding)) {
    throw new Error(
      `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
    );
  }

  if (
    data.relationshipType &&
    !['friend', 'family', 'acquaintance'].includes(data.relationshipType)
  ) {
    throw new Error('Invalid relationship type');
  }
}

export function validateInteractionData(data: CreateInteractionData): void {
  if (!data.memoryEntryId || data.memoryEntryId.trim().length === 0) {
    throw new Error('Memory entry ID is required');
  }

  if (
    !['meeting', 'recognition', 'conversation'].includes(data.interactionType)
  ) {
    throw new Error('Invalid interaction type');
  }
}
