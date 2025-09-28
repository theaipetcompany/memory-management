'use client';

import { useState, useEffect } from 'react';
import { ImageTable } from '@/components/image-table';
import { AddImageModal } from '@/components/add-image-modal';
import { SubmitButton } from '@/components/submit-button';
import { Image } from '@/components/image-table';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';

export function ImageManagement() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    try {
      const data = await fetcher<Image[]>('/api/images');
      if (data) {
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images. Please refresh the page.', {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleAddImages = async (files: File[]) => {
    const successfulUploads: string[] = [];
    const failedUploads: Array<{ filename: string; error: string }> = [];

    try {
      // Upload each file individually without annotation
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('annotation', ''); // Empty annotation, will be edited in table

          const response = await fetch('/api/images', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.details
              ? errorData.details.join(', ')
              : errorData.error || 'Unknown error';

            failedUploads.push({
              filename: file.name,
              error: errorMessage,
            });
            continue;
          }

          const result = await response.json();
          if (!result) {
            failedUploads.push({
              filename: file.name,
              error: 'No response data',
            });
            continue;
          }

          successfulUploads.push(file.name);
        } catch (error) {
          failedUploads.push({
            filename: file.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Show success/failure toasts
      if (successfulUploads.length > 0) {
        toast.success(
          `Successfully uploaded ${successfulUploads.length} image${
            successfulUploads.length !== 1 ? 's' : ''
          }`,
          {
            description: successfulUploads.join(', '),
          }
        );
      }

      if (failedUploads.length > 0) {
        failedUploads.forEach(({ filename, error }) => {
          toast.error(`Failed to upload ${filename}`, {
            description: error,
            duration: 5000,
          });
        });
      }

      // Only refresh if we had successful uploads
      if (successfulUploads.length > 0) {
        await fetchImages(); // Refresh the images list
      }

      // If all uploads failed, show a summary toast but don't throw an error
      if (failedUploads.length === files.length) {
        toast.error('All uploads failed', {
          description: 'Please check your images and try again',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error adding images:', error);
      // Show a generic error toast for unexpected errors
      toast.error('Upload failed', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
    }
  };

  const handleUpdateAnnotation = async (id: string, annotation: string) => {
    try {
      const result = await fetcher(`/api/images/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ annotation }),
      });

      if (result !== null) {
        await fetchImages(); // Refresh the images list
        toast.success('Annotation updated successfully');
      }
    } catch (error) {
      console.error('Error updating annotation:', error);
      toast.error('Failed to update annotation', {
        duration: 5000,
      });
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const result = await fetcher(`/api/images/${id}`, {
        method: 'DELETE',
      });

      if (result !== null) {
        await fetchImages(); // Refresh the images list
        toast.success('Image deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image', {
        duration: 5000,
      });
    }
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
          Images ({images.length})
        </h2>
        <AddImageModal onAddImages={handleAddImages} />
      </div>

      {loading ? (
        <div className="text-center text-slate-600 dark:text-slate-300">
          Loading images...
        </div>
      ) : (
        <>
          <ImageTable
            images={images}
            onDeleteImage={handleDeleteImage}
            onUpdateAnnotation={handleUpdateAnnotation}
          />
          <div className="mt-6">
            <SubmitButton images={images} />
          </div>
        </>
      )}
    </div>
  );
}
