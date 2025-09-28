import { NextRequest, NextResponse } from 'next/server';
import { MemoryManagementService } from '@/lib/memory-management';
import { SimilaritySearchService } from '@/lib/similarity-search';

const memoryService = new MemoryManagementService();

export async function POST(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);

    if (pathname.endsWith('/identify')) {
      return await handleIdentify(request);
    } else if (pathname.endsWith('/learn')) {
      return await handleLearn(request);
    } else if (pathname.endsWith('/search')) {
      return await handleSearch(request);
    } else {
      return NextResponse.json(
        { error: 'Invalid recognition endpoint' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in recognition API:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleIdentify(request: NextRequest) {
  const formData = await request.formData();

  const image = formData.get('image') as File;
  const threshold = parseFloat(formData.get('threshold') as string) || 0.8;
  const topK = parseInt(formData.get('topK') as string) || 5;

  if (!image) {
    return NextResponse.json({ error: 'Image is required' }, { status: 400 });
  }

  // Convert File to Buffer
  const imageBuffer = Buffer.from(await image.arrayBuffer());

  // Recognize face
  const recognitionResult = await memoryService.recognizeFace(
    imageBuffer,
    threshold
  );

  // Format matches for response
  const matches = recognitionResult.similarMemories
    .slice(0, topK)
    .map((match) => ({
      memoryId: match.id,
      name: match.metadata.name,
      similarity: match.similarity,
      confidence: getConfidenceLevel(match.similarity),
      metadata: {
        relationshipType: match.metadata.relationshipType,
        lastSeen: match.metadata.lastSeen.toISOString(),
        interactionCount: match.metadata.interactionCount,
      },
    }));

  return NextResponse.json({
    matches,
    processingTime: 0, // This would be calculated in the actual implementation
    method: 'openai', // This would be determined by the embedding service
  });
}

async function handleLearn(request: NextRequest) {
  const formData = await request.formData();

  const image = formData.get('image') as File;
  const name = formData.get('name') as string;
  const introducedBy = formData.get('introducedBy') as string;
  const notes = formData.get('notes') as string;
  const preferences = formData.get('preferences') as string;
  const tags = formData.get('tags') as string;
  const relationshipType =
    (formData.get('relationshipType') as string) || 'friend';

  if (!image) {
    return NextResponse.json({ error: 'Image is required' }, { status: 400 });
  }

  if (!name || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Convert File to Buffer
  const imageBuffer = Buffer.from(await image.arrayBuffer());

  // Parse arrays
  const preferencesArray = preferences
    ? preferences.split(',').map((p) => p.trim())
    : [];
  const tagsArray = tags ? tags.split(',').map((t) => t.trim()) : [];

  // Create memory entry
  const memoryData = {
    name: name.trim(),
    imageBuffer,
    introducedBy: introducedBy?.trim(),
    notes: notes?.trim(),
    preferences: preferencesArray,
    tags: tagsArray,
    relationshipType: relationshipType as 'friend' | 'family' | 'acquaintance',
  };

  const memory = await memoryService.createMemory(memoryData);

  // Convert dates to ISO strings for JSON response
  const response = {
    memory: {
      ...memory,
      firstMet: memory.firstMet.toISOString(),
      lastSeen: memory.lastSeen.toISOString(),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    },
    processingTime: 0, // This would be calculated in the actual implementation
    method: 'openai', // This would be determined by the embedding service
  };

  return NextResponse.json(response, { status: 201 });
}

async function handleSearch(request: NextRequest) {
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
}

function getConfidenceLevel(similarity: number): 'high' | 'medium' | 'low' {
  if (similarity >= 0.9) return 'high';
  if (similarity >= 0.7) return 'medium';
  return 'low';
}
