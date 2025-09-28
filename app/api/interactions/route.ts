import { NextRequest, NextResponse } from 'next/server';
import { MemoryManagementService } from '@/lib/memory-management';

const memoryService = new MemoryManagementService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      memoryEntryId,
      interactionType,
      context,
      responseGenerated,
      emotion,
      actions = [],
    } = body;

    // Validate required fields
    if (!memoryEntryId || memoryEntryId.trim() === '') {
      return NextResponse.json(
        { error: 'Memory entry ID is required' },
        { status: 400 }
      );
    }

    if (
      !interactionType ||
      !['meeting', 'recognition', 'conversation'].includes(interactionType)
    ) {
      return NextResponse.json(
        {
          error:
            'Valid interaction type is required (meeting, recognition, conversation)',
        },
        { status: 400 }
      );
    }

    // Validate memory exists
    const memory = await memoryService.getMemory(memoryEntryId);
    if (!memory) {
      return NextResponse.json(
        { error: 'Memory entry not found' },
        { status: 404 }
      );
    }

    // Create interaction data
    const interactionData = {
      memoryEntryId: memoryEntryId.trim(),
      interactionType: interactionType as
        | 'meeting'
        | 'recognition'
        | 'conversation',
      context: context?.trim(),
      responseGenerated: responseGenerated?.trim(),
      emotion: emotion?.trim(),
      actions: Array.isArray(actions) ? actions : [],
    };

    // Record interaction
    const interaction = await memoryService.recordInteraction(interactionData);

    // Convert date to ISO string for JSON response
    const response = {
      ...interaction,
      createdAt: interaction.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error recording interaction:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
