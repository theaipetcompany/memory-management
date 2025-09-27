import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import db from '@/lib/db';
import { generateJSONL, validateJSONL } from '@/lib/jsonl-generator';

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

    // Generate JSONL training data
    const jsonlData = await generateJSONL(images);

    // Validate the JSONL data
    const validation = validateJSONL(jsonlData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid training data format',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create a file in OpenAI's format
    const file = await openai.files.create({
      file: new File([jsonlData], 'training-data.jsonl', {
        type: 'application/json',
      }),
      purpose: 'fine-tune',
    });

    // Create the fine-tuning job
    const fineTuningJob = await openai.fineTuning.jobs.create({
      training_file: file.id,
      model: 'gpt-4o-2024-08-06', // Vision model for fine-tuning
    });

    // Create job record in database
    const job = await db.job.create({
      data: {
        status: 'pending',
        openaiJobId: fineTuningJob.id,
      },
    });

    return NextResponse.json(
      {
        ...job,
        openaiFileId: file.id,
        trainingDataSize: images.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting to OpenAI:', error);

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
      { error: 'Failed to submit to OpenAI' },
      { status: 500 }
    );
  }
}
