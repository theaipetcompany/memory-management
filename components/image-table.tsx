'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
  onUpdateAnnotation?: (id: string, annotation: string) => void;
}

export function ImageTable({
  images,
  onDeleteImage,
  onUpdateAnnotation,
}: ImageTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: string }>(
    {}
  );
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const hasSelectedRef = useRef<{ [key: string]: boolean }>({});
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

  const handleEditStart = (id: string, currentAnnotation: string) => {
    setEditingId(id);
    setEditingValues((prev) => ({
      ...prev,
      [id]: currentAnnotation,
    }));
    // Reset the selection flag when starting to edit
    hasSelectedRef.current[id] = false;
  };

  const handleEditSave = async (id: string) => {
    if (onUpdateAnnotation) {
      const currentValue = editingValues[id] || '';
      await onUpdateAnnotation(id, currentValue.trim());
    }
    setEditingId(null);
    setEditingValues((prev) => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingValues((prev) => {
      const newValues = { ...prev };
      if (editingId) {
        delete newValues[editingId];
      }
      return newValues;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleEditSave(id);
      // Move to next annotation input
      const currentIndex = images.findIndex((img) => img.id === id);
      const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < images.length) {
        const nextId = images[nextIndex].id;
        setTimeout(() => {
          handleEditStart(nextId, images[nextIndex].annotation);
        }, 0);
      }
    }
  };

  const handleInputRef = (id: string) => (el: HTMLInputElement | null) => {
    inputRefs.current[id] = el;
    if (el && editingId === id && !hasSelectedRef.current[id]) {
      el.focus();
      el.select();
      hasSelectedRef.current[id] = true;
    }
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
              <TableCell>
                {editingId === image.id ? (
                  <Input
                    ref={handleInputRef(image.id)}
                    value={editingValues[image.id] || ''}
                    onChange={(e) =>
                      setEditingValues((prev) => ({
                        ...prev,
                        [image.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => handleKeyDown(e, image.id)}
                    onBlur={() => handleEditSave(image.id)}
                    className="w-full"
                    placeholder="Enter annotation..."
                    autoFocus
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[2rem] flex items-center"
                    onClick={() => handleEditStart(image.id, image.annotation)}
                    title="Click to edit annotation"
                  >
                    {image.annotation || (
                      <span className="text-gray-400 italic">
                        Click to add annotation...
                      </span>
                    )}
                  </div>
                )}
              </TableCell>
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
