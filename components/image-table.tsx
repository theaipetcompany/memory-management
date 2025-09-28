'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';

export interface Image {
  id: string;
  filename: string;
  annotation: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date | string;
}

interface ImageTableProps {
  images: Image[];
  onDeleteImage: (id: string) => void;
}

export function ImageTable({ images, onDeleteImage }: ImageTableProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No images uploaded yet</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  const getImageUrl = (filePath: string): string => {
    const filename = filePath.split('/').pop();
    return `/uploads/${filename}`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Preview</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead>Annotation</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell>
                <div className="w-16 h-16 relative">
                  <Image
                    src={getImageUrl(image.filePath)}
                    alt={image.filename}
                    fill
                    className="object-cover rounded"
                    sizes="64px"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{image.filename}</TableCell>
              <TableCell>{image.annotation}</TableCell>
              <TableCell>{formatFileSize(image.fileSize)}</TableCell>
              <TableCell>{formatDate(image.createdAt)}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteImage(image.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
