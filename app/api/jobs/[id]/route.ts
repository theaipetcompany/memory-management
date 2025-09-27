import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, openaiJobId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const updatedJob = await db.job.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(openaiJobId && { openaiJobId }),
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
