import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import db from '@/lib/db';
import { generateJSONL, validateJSONL } from '@/lib/jsonl-generator';
import {
  createTempJobFolder,
  copyFileToTemp,
  cleanupTempJobFolder,
} from '@/lib/file-storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageIds } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Image IDs are required' },
        { status: 400 }
      );
    }

    if (imageIds.length < 10) {
      return NextResponse.json(
        { error: 'Minimum 10 images required for fine-tuning' },
        { status: 400 }
      );
    }

    // Get selected images from database
    const images = await db.image.findMany({
      where: {
        id: {
          in: imageIds,
        },
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images found with provided IDs' },
        { status: 400 }
      );
    }

    // Create job record first to get job ID
    const job = await db.job.create({
      data: {
        status: 'pending',
      },
    });

    // Create temporary folder for this job
    const tempDir = await createTempJobFolder(job.id);

    try {
      // Copy selected images to temp folder
      const tempImagePaths: string[] = [];
      for (const image of images) {
        const filename = image.filePath.split('/').pop() || `${image.id}.jpg`;
        const tempPath = await copyFileToTemp(
          image.filePath,
          tempDir,
          filename
        );
        tempImagePaths.push(tempPath);
      }

      // Generate JSONL training data
      const jsonlResult = await generateJSONL(images);

      // Check for validation errors
      if (jsonlResult.validationErrors.length > 0) {
        await cleanupTempJobFolder(job.id);
        return NextResponse.json(
          {
            error: 'Dataset validation failed',
            details: jsonlResult.validationErrors,
            skippedImages: jsonlResult.skippedImages,
          },
          { status: 400 }
        );
      }

      // Check if we have any valid examples
      if (jsonlResult.validExamples === 0) {
        await cleanupTempJobFolder(job.id);
        return NextResponse.json(
          {
            error: 'No valid training examples found',
            details: jsonlResult.skippedImages,
          },
          { status: 400 }
        );
      }

      // Validate the JSONL data structure
      const validation = validateJSONL(jsonlResult.jsonl);
      if (!validation.valid) {
        await cleanupTempJobFolder(job.id);
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
        file: new File([jsonlResult.jsonl], 'training-data.jsonl', {
          type: 'application/json',
        }),
        purpose: 'fine-tune',
      });

      // Create the fine-tuning job
      const fineTuningJob = await openai.fineTuning.jobs.create({
        training_file: file.id,
        model: 'gpt-4o-2024-08-06', // Vision model for fine-tuning
      });

      // Update job record with OpenAI job ID
      const updatedJob = await db.job.update({
        where: { id: job.id },
        data: {
          openaiJobId: fineTuningJob.id,
        },
      });

      // Clean up temp folder after successful submission
      await cleanupTempJobFolder(job.id);

      return NextResponse.json(
        {
          ...updatedJob,
          openaiFileId: file.id,
          trainingDataSize: jsonlResult.validExamples,
          skippedImages: jsonlResult.skippedImages,
        },
        { status: 201 }
      );
    } catch (error) {
      // Clean up temp folder on error
      await cleanupTempJobFolder(job.id);
      throw error;
    }
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
