import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    // List fine-tuning jobs from OpenAI
    const fineTuningJobs = await openai.fineTuning.jobs.list();

    return NextResponse.json({
      jobs: fineTuningJobs.data,
      total: fineTuningJobs.data.length,
    });
  } catch (error) {
    console.error('Error fetching fine-tuning jobs:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch fine-tuning jobs' },
      { status: 500 }
    );
  }
}
