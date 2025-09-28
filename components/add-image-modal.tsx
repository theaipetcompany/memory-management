'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddImageModalProps {
  onAddImages: (data: { files: File[]; annotation: string }) => void;
}

export function AddImageModal({ onAddImages }: AddImageModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [annotation, setAnnotation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFiles = (files: File[]): boolean => {
    if (files.length === 0) {
      setError('Please select at least one image file');
      return false;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" is not an image file`);
        return false;
      }
    }
    return true;
  };

  const validateAnnotation = (annotation: string): boolean => {
    if (!annotation.trim()) {
      setError('Annotation is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateFiles(files)) return;
    if (!validateAnnotation(annotation)) return;

    setIsSubmitting(true);
    try {
      await onAddImages({ files, annotation: annotation.trim() });
      setFiles([]);
      setAnnotation('');
      setOpen(false);
    } catch (err) {
      setError(`Upload failed. Please try again`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = async () => {
    setError(null);

    if (!validateFiles(files)) return;
    if (!validateAnnotation(annotation)) return;

    setIsSubmitting(true);
    try {
      await onAddImages({ files, annotation: annotation.trim() });
      setFiles([]);
      setAnnotation('');
      setOpen(false);
    } catch (err) {
      setError(`Upload failed. Please try again`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setError(null);
    }
  };

  const handleAnnotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnnotation(e.target.value);
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    handleSubmitClick();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Images</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Images</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Image Files</Label>
            <Input
              id="files"
              name="files"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              required
            />
            {files.length > 0 && (
              <p className="text-sm text-gray-600">
                Selected {files.length} file{files.length !== 1 ? 's' : ''}:{' '}
                {files.map((f) => f.name).join(', ')}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="annotation">Annotation</Label>
            <Input
              id="annotation"
              name="annotation"
              value={annotation}
              onChange={handleAnnotationChange}
              placeholder="Describe the image..."
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
              {error.includes('Upload failed') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2"
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitClick}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Adding...'
                : `Add ${files.length} Image${files.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
