import { NextRequest, NextResponse } from 'next/server';
import { SimilaritySearchService } from '@/lib/similarity-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      embedding,
      threshold = 0.8,
      topK = 10,
      relationshipTypes,
      excludeIds,
    } = body;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
      return NextResponse.json(
        { error: 'Valid 768-dimensional embedding is required' },
        { status: 400 }
      );
    }

    // Search for similar faces
    const results = await SimilaritySearchService.findSimilarFaces(embedding, {
      threshold,
      topK,
      relationshipTypes,
      excludeIds,
    });

    return NextResponse.json({
      results,
      processingTime: 0, // This would be calculated in the actual implementation
    });
  } catch (error) {
    console.error('Error in similarity search:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
