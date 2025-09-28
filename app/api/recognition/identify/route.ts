import { NextRequest, NextResponse } from 'next/server';
import { MemoryManagementService } from '@/lib/memory-management';

const memoryService = new MemoryManagementService();

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error in face identification:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getConfidenceLevel(similarity: number): 'high' | 'medium' | 'low' {
  if (similarity >= 0.9) return 'high';
  if (similarity >= 0.7) return 'medium';
  return 'low';
}
