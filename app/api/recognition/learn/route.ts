import { NextRequest, NextResponse } from 'next/server';
import { MemoryManagementService } from '@/lib/memory-management';

const memoryService = new MemoryManagementService();

export async function POST(request: NextRequest) {
  try {
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
      relationshipType: relationshipType as
        | 'friend'
        | 'family'
        | 'acquaintance',
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
  } catch (error) {
    console.error('Error in face learning:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
