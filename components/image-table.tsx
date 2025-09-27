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

export interface Image {
  id: string;
  filename: string;
  annotation: string;
  createdAt: Date;
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Annotation</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell className="font-medium">{image.filename}</TableCell>
              <TableCell>{image.annotation}</TableCell>
              <TableCell>{image.createdAt.toLocaleDateString()}</TableCell>
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
