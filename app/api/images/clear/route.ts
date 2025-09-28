import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    // Delete all images from the database
    const result = await db.image.deleteMany({});

    return NextResponse.json(
      {
        message: 'All images cleared successfully',
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error clearing images:', error);
    return NextResponse.json(
      { error: 'Failed to clear images' },
      { status: 500 }
    );
  }
}
