'use client';

import { useState } from 'react';
import { MemoryStats } from '@/components/memory-stats';
import { MemoryTable } from '@/components/memory-table';
import { FaceUpload } from '@/components/face-upload';
import { MemoryEntry } from '@/types/memory';
import { useMemories } from '@/hooks/use-memories';

export default function MemoryPage() {
  const {
    memories,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    refetch,
  } = useMemories();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (file: File, name: string) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', name);

      const newMemory = await createMemory(formData);
      if (newMemory) {
        console.log('Memory created successfully:', newMemory);
        // Refresh the memories list
        await refetch();
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload image'
      );
      console.error('Error uploading image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFaceDetected = async (faces: any[]) => {
    console.log('Faces detected:', faces);
  };

  const handleFaceLinked = async (name: string, faces: any[]) => {
    console.log('Face linked with name:', name, 'Faces:', faces);
    // Here you could implement additional logic to link faces with existing memories
    // or create new memories based on face recognition
  };

  const handleMemoryEdit = async (memory: MemoryEntry) => {
    console.log('Edit memory:', memory);
    // In a real app, this would open a modal for editing
    // For now, we'll just log the action
  };

  const handleMemoryDelete = async (id: string) => {
    const success = await deleteMemory(id);
    if (success) {
      console.log('Memory deleted successfully');
    } else {
      console.error('Failed to delete memory');
    }
  };

  const handleViewInteractions = (id: string) => {
    const memory = memories.find((m) => m.id === id);
    console.log('View interactions for:', memory?.name);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Memory Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your pet memories and test face recognition capabilities
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading memories
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => refetch()}
                    className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !memories.length && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading memories...
            </p>
          </div>
        )}

        {!loading && (
          <div className="space-y-8">
            {/* Memory Statistics */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Memory Statistics
              </h2>
              <MemoryStats memories={memories} />
            </section>

            {/* Memory Table */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Memory Entries
              </h2>
              <MemoryTable
                memories={memories}
                onEdit={handleMemoryEdit}
                onDelete={handleMemoryDelete}
                onViewInteractions={handleViewInteractions}
              />
            </section>

            {/* Face Upload Testing */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Face Recognition Testing
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <FaceUpload
                  onImageUpload={handleImageUpload}
                  onFaceDetected={handleFaceDetected}
                  onFaceLinked={handleFaceLinked}
                  loading={isUploading}
                  error={uploadError || undefined}
                  showNameField={true}
                  showSubmitButton={true}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
