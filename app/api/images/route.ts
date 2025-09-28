import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { storeFile } from '@/lib/file-storage';
import {
  validateImageFile,
  OPENAI_VISION_REQUIREMENTS,
} from '@/lib/image-validation';

export async function GET() {
  try {
    const images = await db.image.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const annotation = formData.get('annotation') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Comprehensive image validation using OpenAI vision requirements
    const validation = await validateImageFile(
      file,
      OPENAI_VISION_REQUIREMENTS
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Image validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${file.name}`;

    // Store the file
    const storedFile = await storeFile(file, filename);

    // Create database record
    const image = await db.image.create({
      data: {
        filename: file.name,
        annotation: annotation?.trim() || '',
        filePath: storedFile.filePath,
        fileSize: storedFile.fileSize,
        mimeType: storedFile.mimeType,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 }
    );
  }
}
