'use client';

import { useState, useEffect } from 'react';
import { ImageTable } from '@/components/image-table';
import { AddImageModal } from '@/components/add-image-modal';
import { SubmitButton } from '@/components/submit-button';
import { Image } from '@/components/image-table';
import { fetcher } from '@/lib/fetcher';

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleAddImages = async (data: {
    files: File[];
    annotation: string;
  }) => {
    try {
      // Upload each file individually with the same annotation
      for (const file of data.files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('annotation', data.annotation);

        const result = await fetcher('/api/images', {
          method: 'POST',
          body: formData,
        });

        if (result === null) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      await fetchImages(); // Refresh the images list
    } catch (error) {
      console.error('Error adding images:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const result = await fetcher(`/api/images/${id}`, {
        method: 'DELETE',
      });

      if (result !== null) {
        await fetchImages(); // Refresh the images list
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl">
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
          <ImageTable images={images} onDeleteImage={handleDeleteImage} />
          <div className="mt-6">
            <SubmitButton images={images} />
          </div>
        </>
      )}
    </div>
  );
}
