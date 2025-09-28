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
  onAddImages: (files: File[]) => void;
}

export function AddImageModal({ onAddImages }: AddImageModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateFiles(files)) return;

    setIsSubmitting(true);
    try {
      await onAddImages(files);
      setFiles([]);
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

    setIsSubmitting(true);
    try {
      await onAddImages(files);
      setFiles([]);
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  {error.includes('Upload failed') && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="text-red-700 border-red-300 hover:bg-red-50"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
