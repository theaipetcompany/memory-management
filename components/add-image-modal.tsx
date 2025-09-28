'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddImageModalProps {
  onAddImages: (files: File[]) => void;
}

export function AddImageModal({ onAddImages }: AddImageModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateFiles = (files: File[]): boolean => {
    if (files.length === 0) {
      return false;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFiles(files)) return;

    setIsSubmitting(true);
    try {
      await onAddImages(files);
      setFiles([]);
    } catch (err) {
      // Error handling is now done in the parent component with toasts
    } finally {
      setIsSubmitting(false);
      setOpen(false); // Always close the modal after submission attempt
    }
  };

  const handleSubmitClick = async () => {
    if (!validateFiles(files)) return;

    setIsSubmitting(true);
    try {
      await onAddImages(files);
      setFiles([]);
    } catch (err) {
      // Error handling is now done in the parent component with toasts
    } finally {
      setIsSubmitting(false);
      setOpen(false); // Always close the modal after submission attempt
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
    }
  };
  const handleRetry = () => {
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
          <DialogDescription>
            Select one or more image files to add to your training dataset.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Image Files</Label>
            <div className="relative">
              <Input
                id="files"
                name="files"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                required
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors bg-white"
              />
            </div>
            {files.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected {files.length} file{files.length !== 1 ? 's' : ''}:
                </p>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 flex items-center"
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {file.name}
                      <span className="ml-2 text-gray-400">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
