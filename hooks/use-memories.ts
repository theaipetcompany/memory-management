'use client';

import { useState, useEffect, useCallback } from 'react';
import { MemoryEntry } from '@/types/memory';

interface UseMemoriesOptions {
  page?: number;
  limit?: number;
  relationshipType?: 'friend' | 'family' | 'acquaintance';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseMemoriesReturn {
  memories: MemoryEntry[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
  createMemory: (data: FormData) => Promise<MemoryEntry | null>;
  updateMemory: (
    id: string,
    data: Partial<MemoryEntry>
  ) => Promise<MemoryEntry | null>;
  deleteMemory: (id: string) => Promise<boolean>;
}

export function useMemories(
  options: UseMemoriesOptions = {}
): UseMemoriesReturn {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] =
    useState<UseMemoriesReturn['pagination']>(null);

  const {
    page = 1,
    limit = 20,
    relationshipType,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
  } = options;

  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (relationshipType) {
        params.append('relationshipType', relationshipType);
      }

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/memories?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch memories: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert ISO strings back to Date objects
      const memoriesWithDates = data.memories.map((memory: any) => ({
        ...memory,
        firstMet: new Date(memory.firstMet),
        lastSeen: new Date(memory.lastSeen),
        createdAt: new Date(memory.createdAt),
        updatedAt: new Date(memory.updatedAt),
      }));

      setMemories(memoriesWithDates);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memories');
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, relationshipType, search, sortBy, sortOrder]);

  const createMemory = useCallback(
    async (data: FormData): Promise<MemoryEntry | null> => {
      try {
        const response = await fetch('/api/memories', {
          method: 'POST',
          body: data,
        });

        if (!response.ok) {
          throw new Error(`Failed to create memory: ${response.statusText}`);
        }

        const newMemory = await response.json();

        // Convert ISO strings back to Date objects
        const memoryWithDates = {
          ...newMemory,
          firstMet: new Date(newMemory.firstMet),
          lastSeen: new Date(newMemory.lastSeen),
          createdAt: new Date(newMemory.createdAt),
          updatedAt: new Date(newMemory.updatedAt),
        };

        // Add to local state
        setMemories((prev) => [memoryWithDates, ...prev]);

        return memoryWithDates;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create memory'
        );
        console.error('Error creating memory:', err);
        return null;
      }
    },
    []
  );

  const updateMemory = useCallback(
    async (
      id: string,
      data: Partial<MemoryEntry>
    ): Promise<MemoryEntry | null> => {
      try {
        const response = await fetch(`/api/memories/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to update memory: ${response.statusText}`);
        }

        const updatedMemory = await response.json();

        // Convert ISO strings back to Date objects
        const memoryWithDates = {
          ...updatedMemory,
          firstMet: new Date(updatedMemory.firstMet),
          lastSeen: new Date(updatedMemory.lastSeen),
          createdAt: new Date(updatedMemory.createdAt),
          updatedAt: new Date(updatedMemory.updatedAt),
        };

        // Update local state
        setMemories((prev) =>
          prev.map((m) => (m.id === id ? memoryWithDates : m))
        );

        return memoryWithDates;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update memory'
        );
        console.error('Error updating memory:', err);
        return null;
      }
    },
    []
  );

  const deleteMemory = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete memory: ${response.statusText}`);
      }

      // Remove from local state
      setMemories((prev) => prev.filter((m) => m.id !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
      console.error('Error deleting memory:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return {
    memories,
    loading,
    error,
    pagination,
    refetch: fetchMemories,
    createMemory,
    updateMemory,
    deleteMemory,
  };
}
