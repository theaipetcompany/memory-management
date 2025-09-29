import { NextRequest, NextResponse } from 'next/server';
import { MemoryManagementService } from '@/lib/memory-management';

const memoryService = new MemoryManagementService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const interactionType = searchParams.get('interactionType');
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      );
    }

    // Check if memory exists
    const memory = await memoryService.getMemory(memoryId);
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Get interaction history
    const interactions = await memoryService.getInteractionHistory(memoryId);

    // Filter by interaction type if specified
    let filteredInteractions = interactions;
    if (
      interactionType &&
      ['meeting', 'recognition', 'conversation'].includes(interactionType)
    ) {
      filteredInteractions = interactions.filter(
        (interaction) => interaction.interactionType === interactionType
      );
    }

    // Sort interactions
    filteredInteractions.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.createdAt.getTime() - b.createdAt.getTime();
      } else {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedInteractions = filteredInteractions.slice(
      offset,
      offset + limit
    );

    // Convert dates to ISO strings for JSON response
    const responseInteractions = paginatedInteractions.map((interaction) => ({
      ...interaction,
      createdAt: interaction.createdAt.toISOString(),
    }));

    const total = filteredInteractions.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      interactions: responseInteractions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
