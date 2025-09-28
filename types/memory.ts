// Core types for AI Pet Memory system

export interface MemoryEntry {
  id: string;
  name: string;
  embedding: number[]; // 768-dimensional vector
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

export interface FaceRecognitionResult {
  recognized: boolean;
  memoryEntry?: MemoryEntry;
  confidence: number;
  similarMemories: SimilaritySearchResult[];
}

export interface EmbeddingGenerationResult {
  embedding: number[];
  processingTime: number;
  success: boolean;
  error?: string;
}

// Constants
export const EMBEDDING_DIMENSION = 768;
export const SIMILARITY_THRESHOLD = 0.8;
export const MAX_SIMILARITY_RESULTS = 10;

// Validation helpers
export function validateEmbedding(
  embedding: number[] | null | undefined
): boolean {
  if (!embedding || !Array.isArray(embedding)) {
    return false;
  }
  return (
    embedding.length === EMBEDDING_DIMENSION &&
    embedding.every((val) => typeof val === 'number' && !isNaN(val))
  );
}

export function validateMemoryEntryData(data: CreateMemoryEntryData): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.embedding || !validateEmbedding(data.embedding)) {
    errors.push(
      `Embedding must be a ${EMBEDDING_DIMENSION}-dimensional vector`
    );
  }

  if (data.preferences && !Array.isArray(data.preferences)) {
    errors.push('Preferences must be an array');
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  if (
    data.relationshipType &&
    !['friend', 'family', 'acquaintance'].includes(data.relationshipType)
  ) {
    errors.push('Relationship type must be friend, family, or acquaintance');
  }

  return errors;
}
