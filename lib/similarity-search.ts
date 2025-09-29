import { findSimilarMemories } from '@/lib/memory-database';
import { SimilaritySearchResult, MemoryEntry } from '@/types/memory';
import { PrismaClient } from '@/lib/prisma/client';

export interface SearchOptions {
  threshold: number; // Minimum similarity score (0-1)
  topK: number; // Maximum number of results
  relationshipTypes?: string[]; // Filter by relationship type
  excludeIds?: string[]; // Exclude specific memory IDs
}

export interface SimilaritySearchService {
  findSimilarFaces(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SimilaritySearchResult[]>;

  calculateSimilarity(embedding1: number[], embedding2: number[]): number;
}

export class SimilaritySearchServiceImpl implements SimilaritySearchService {
  private prisma: PrismaClient;
  private usePgVector: boolean;

  constructor() {
    this.prisma = new PrismaClient();
    // Check if pgvector extension is available
    this.usePgVector = this.checkPgVectorAvailability();
  }

  private checkPgVectorAvailability(): boolean {
    // In a real implementation, you would check if the pgvector extension is installed
    // For now, we'll use an environment variable or configuration
    return process.env.PGVECTOR_ENABLED === 'true';
  }

  async findSimilarFaces(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SimilaritySearchResult[]> {
    try {
      if (this.usePgVector) {
        return await this.findSimilarFacesWithPgVector(queryEmbedding, options);
      } else {
        return await this.findSimilarFacesWithJavaScript(
          queryEmbedding,
          options
        );
      }
    } catch (error) {
      console.error('Error in similarity search:', error);
      return [];
    }
  }

  private async findSimilarFacesWithPgVector(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SimilaritySearchResult[]> {
    // Use pgvector for similarity search
    const queryVector = `[${queryEmbedding.join(',')}]`;

    // Build the query with filters
    let whereClause = `1=1`;
    const params: any[] = [queryVector, options.threshold];

    if (options.relationshipTypes && options.relationshipTypes.length > 0) {
      const relationshipFilter = options.relationshipTypes
        .map((_, index) => `$${params.length + 1 + index}`)
        .join(',');
      whereClause += ` AND "relationshipType" IN (${relationshipFilter})`;
      params.push(...options.relationshipTypes);
    }

    if (options.excludeIds && options.excludeIds.length > 0) {
      const excludeFilter = options.excludeIds
        .map((_, index) => `$${params.length + 1 + index}`)
        .join(',');
      whereClause += ` AND id NOT IN (${excludeFilter})`;
      params.push(...options.excludeIds);
    }

    // Execute raw query with pgvector
    const query = `
      SELECT
        id,
        name,
        embedding,
        "firstMet",
        "lastSeen",
        "interactionCount",
        "introducedBy",
        notes,
        preferences,
        tags,
        "relationshipType",
        "createdAt",
        "updatedAt",
        (embedding <-> $1::vector) as distance
      FROM memory_entries
      WHERE ${whereClause}
        AND (embedding <-> $1::vector) < (1 - $2)
      ORDER BY embedding <-> $1::vector
      LIMIT ${options.topK}
    `;

    const results = await this.prisma.$queryRawUnsafe(query, ...params);

    return (results as any[]).map((row: any) => ({
      id: row.id,
      similarity: 1 - row.distance, // Convert distance to similarity
      metadata: {
        id: row.id,
        name: row.name,
        embedding: row.embedding,
        firstMet: new Date(row.firstMet),
        lastSeen: new Date(row.lastSeen),
        interactionCount: row.interactionCount,
        introducedBy: row.introducedBy,
        notes: row.notes,
        preferences: row.preferences,
        tags: row.tags,
        relationshipType: row.relationshipType,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    }));
  }

  private async findSimilarFacesWithJavaScript(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SimilaritySearchResult[]> {
    // Get similar memories from database using JavaScript implementation
    const results = await findSimilarMemories(
      queryEmbedding,
      options.threshold,
      options.topK
    );

    // Apply additional filters
    let filteredResults = results;

    // Filter by relationship types
    if (options.relationshipTypes && options.relationshipTypes.length > 0) {
      filteredResults = filteredResults.filter((result) =>
        options.relationshipTypes!.includes(result.metadata.relationshipType)
      );
    }

    // Exclude specified IDs
    if (options.excludeIds && options.excludeIds.length > 0) {
      filteredResults = filteredResults.filter(
        (result) => !options.excludeIds!.includes(result.id)
      );
    }

    // Sort by similarity (highest first)
    return filteredResults.sort((a, b) => b.similarity - a.similarity);
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      normA += embedding1[i] * embedding1[i];
      normB += embedding2[i] * embedding2[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Export singleton instance
export const SimilaritySearchService = new SimilaritySearchServiceImpl();
