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
  onAddImage: (data: { file: File; annotation: string }) => void;
}

export function AddImageModal({ onAddImage }: AddImageModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [annotation, setAnnotation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (file && annotation.trim()) {
      await onAddImage({ file, annotation: annotation.trim() });
      setFile(null);
      setAnnotation('');
      setOpen(false);
    }
  };

  const handleSubmitClick = async () => {
    if (file && annotation.trim()) {
      await onAddImage({ file, annotation: annotation.trim() });
      setFile(null);
      setAnnotation('');
      setOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Image</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Image</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Image File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="annotation">Annotation</Label>
            <Input
              id="annotation"
              name="annotation"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="Describe the image..."
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmitClick}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
