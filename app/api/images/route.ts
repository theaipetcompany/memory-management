import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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

    if (!file || !annotation) {
      return NextResponse.json(
        { error: 'File and annotation are required' },
        { status: 400 }
      );
    }

    // For now, we'll just store the filename and annotation
    // In a real implementation, you'd want to upload the file to a storage service
    const image = await db.image.create({
      data: {
        filename: file.name,
        annotation: annotation.trim(),
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
