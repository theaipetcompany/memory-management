'use client';

import { useState, useEffect } from 'react';
import { ImageTable } from '@/components/image-table';
import { AddImageModal } from '@/components/add-image-modal';
import { SubmitButton } from '@/components/submit-button';
import { Image } from '@/components/image-table';
import { fetcher } from '@/lib/fetcher';

export function ImageManagement() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
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

  const handleAddImage = async (data: { file: File; annotation: string }) => {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('annotation', data.annotation);

      const result = await fetcher('/api/images', {
        method: 'POST',
        body: formData,
      });

      if (result !== null) {
        await fetchImages(); // Refresh the images list
      }
    } catch (error) {
      console.error('Error adding image:', error);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const result = await fetcher(`/api/images/${id}`, {
        method: 'DELETE',
      });

      if (result !== null) {
        await fetchImages(); // Refresh the images list
        // Remove from selected images if it was selected
        setSelectedImages((prev) => prev.filter((imgId) => imgId !== id));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleImageSelect = (imageId: string, selected: boolean) => {
    setSelectedImages((prev) =>
      selected ? [...prev, imageId] : prev.filter((id) => id !== imageId)
    );
  };

  const selectedImagesData = images.filter((img) =>
    selectedImages.includes(img.id)
  );

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
          Images ({images.length}) - Selected: {selectedImages.length}
        </h2>
        <AddImageModal onAddImage={handleAddImage} />
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
            selectedImages={selectedImages}
            onImageSelect={handleImageSelect}
          />
          <div className="mt-6">
            <SubmitButton images={selectedImagesData} />
          </div>
        </>
      )}
    </div>
  );
}
