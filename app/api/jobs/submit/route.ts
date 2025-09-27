import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import db from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  try {
    // Get all images from database
    const images = await db.image.findMany();

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images found to submit' },
        { status: 400 }
      );
    }

    // For now, we'll create a mock fine-tuning job
    // In a real implementation, you would:
    // 1. Upload images to OpenAI Files API
    // 2. Create a fine-tuning job
    // 3. Store the job ID in the database

    const mockJobId = `ftjob-${Date.now()}`;

    // Create job record in database
    const job = await db.job.create({
      data: {
        status: 'pending',
        openaiJobId: mockJobId,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error submitting to OpenAI:', error);
    return NextResponse.json(
      { error: 'Failed to submit to OpenAI' },
      { status: 500 }
    );
  }
}
