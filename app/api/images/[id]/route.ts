import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { deleteFile } from '@/lib/file-storage';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    if (!body.annotation) {
      return NextResponse.json(
        { error: 'Annotation is required' },
        { status: 400 }
      );
    }

    const updatedImage = await db.image.update({
      where: { id },
      data: { annotation: body.annotation },
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('Error updating image annotation:', error);
    return NextResponse.json(
      { error: 'Failed to update annotation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get the image first to access file path
    const image = await db.image.findUnique({
      where: { id },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete the file from storage
    await deleteFile(image.filePath);

    // Delete from database
    const deletedImage = await db.image.delete({
      where: { id },
    });

    return NextResponse.json(deletedImage);
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
