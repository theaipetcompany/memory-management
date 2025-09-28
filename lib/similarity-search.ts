import { findSimilarMemories } from '@/lib/memory-database';
import { SimilaritySearchResult, MemoryEntry } from '@/types/memory';

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
  async findSimilarFaces(
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SimilaritySearchResult[]> {
    try {
      // Get similar memories from database
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
    } catch (error) {
      console.error('Error in similarity search:', error);
      return [];
    }
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
