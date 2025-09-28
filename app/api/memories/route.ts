import { NextRequest, NextResponse } from 'next/server';
import { MemoryManagementService } from '@/lib/memory-management';

const memoryService = new MemoryManagementService();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form data
    const name = formData.get('name') as string;
    const image = formData.get('image') as File;
    const introducedBy = formData.get('introducedBy') as string;
    const notes = formData.get('notes') as string;
    const preferences = formData.get('preferences') as string;
    const tags = formData.get('tags') as string;
    const relationshipType =
      (formData.get('relationshipType') as string) || 'friend';

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
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
      ...memory,
      firstMet: memory.firstMet.toISOString(),
      lastSeen: memory.lastSeen.toISOString(),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const relationshipType = searchParams.get('relationshipType');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    let memories;
    let total = 0;

    if (search) {
      // Use search functionality
      memories = await memoryService.searchMemories(search);
      total = memories.length;
    } else {
      // Use list functionality
      const options = {
        limit,
        offset: (page - 1) * limit,
        relationshipTypes: relationshipType
          ? [relationshipType as 'friend' | 'family' | 'acquaintance']
          : undefined,
      };

      memories = await memoryService.listMemories(options);

      // For now, we'll get all memories to calculate total
      // In a real implementation, you'd want to add a count method to the service
      const allMemories = await memoryService.listMemories();
      total = allMemories.length;
    }

    // Sort memories
    memories.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'firstMet':
          aValue = a.firstMet;
          bValue = b.firstMet;
          break;
        case 'lastSeen':
          aValue = a.lastSeen;
          bValue = b.lastSeen;
          break;
        case 'interactionCount':
          aValue = a.interactionCount;
          bValue = b.interactionCount;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Convert dates to ISO strings for JSON response
    const responseMemories = memories.map((memory) => ({
      ...memory,
      firstMet: memory.firstMet.toISOString(),
      lastSeen: memory.lastSeen.toISOString(),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      memories: responseMemories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching memories:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
