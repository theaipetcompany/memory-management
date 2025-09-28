'use client';

import { useState } from 'react';
import { MemoryStats } from '@/components/memory-stats';
import { MemoryTable } from '@/components/memory-table';
import { FaceUpload } from '@/components/face-upload';
import { MemoryEntry } from '@/types/memory';

// Mock data for demonstration
const mockMemories: MemoryEntry[] = [
  {
    id: '1',
    name: 'Buddy',
    embedding: new Array(768).fill(0.1),
    firstMet: new Date('2023-01-15'),
    lastSeen: new Date('2024-01-10'),
    interactionCount: 45,
    introducedBy: 'Sarah',
    notes: 'Very friendly golden retriever',
    preferences: ['tennis balls', 'belly rubs'],
    tags: ['friendly', 'energetic'],
    relationshipType: 'friend',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'Whiskers',
    embedding: new Array(768).fill(0.2),
    firstMet: new Date('2023-03-20'),
    lastSeen: new Date('2024-01-08'),
    interactionCount: 23,
    introducedBy: 'Mike',
    notes: 'Calm and independent cat',
    preferences: ['catnip', 'sunny spots'],
    tags: ['calm', 'independent'],
    relationshipType: 'acquaintance',
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '3',
    name: 'Max',
    embedding: new Array(768).fill(0.3),
    firstMet: new Date('2022-12-01'),
    lastSeen: new Date('2024-01-12'),
    interactionCount: 78,
    introducedBy: 'Family',
    notes: 'Our family dog, very loyal',
    preferences: ['walks', 'treats'],
    tags: ['loyal', 'family'],
    relationshipType: 'family',
    createdAt: new Date('2022-12-01'),
    updatedAt: new Date('2024-01-12'),
  },
];

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>(mockMemories);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    // Simulate upload process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUploading(false);
    console.log('Image uploaded:', file.name);
  };

  const handleFaceDetected = async (faces: any[]) => {
    console.log('Faces detected:', faces);
  };

  const handleMemoryEdit = (memory: MemoryEntry) => {
    console.log('Edit memory:', memory);
  };

  const handleMemoryDelete = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
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
                loading={isUploading}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
