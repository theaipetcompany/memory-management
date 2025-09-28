'use client';

import React, { useState, useMemo } from 'react';
import { MemoryEntry } from '@/types/memory';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MemoryTableProps {
  memories: MemoryEntry[];
  onEdit?: (memory: MemoryEntry) => void;
  onDelete?: (id: string) => void;
  onViewInteractions?: (id: string) => void;
  loading?: boolean;
}

type SortField =
  | 'name'
  | 'firstMet'
  | 'lastSeen'
  | 'interactionCount'
  | 'relationshipType';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

export function MemoryTable({
  memories,
  onEdit,
  onDelete,
  onViewInteractions,
  loading = false,
}: MemoryTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Sort memories based on current sort configuration
  const sortedMemories = useMemo(() => {
    const sorted = [...memories].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'firstMet':
        case 'lastSeen':
          aValue = a[sortConfig.field].getTime();
          bValue = b[sortConfig.field].getTime();
          break;
        case 'interactionCount':
          aValue = a.interactionCount;
          bValue = b.interactionCount;
          break;
        case 'relationshipType':
          aValue = a.relationshipType;
          bValue = b.relationshipType;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [memories, sortConfig]);

  // Paginate sorted memories
  const paginatedMemories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedMemories.slice(startIndex, endIndex);
  }, [sortedMemories, currentPage]);

  const totalPages = Math.ceil(sortedMemories.length / ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSortLabel = (field: SortField) => {
    if (sortConfig.field !== field) return '';
    return `Sorted by ${field} ${
      sortConfig.direction === 'asc' ? 'ascending' : 'descending'
    }`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading memories...</p>
        </div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground text-lg">No memories found</p>
        <p className="text-muted-foreground text-sm mt-2">
          Start by adding your first memory
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-primary"
                  aria-label={getSortLabel('name')}
                >
                  <span>Name</span>
                  {sortConfig.field === 'name' && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('firstMet')}
                  className="flex items-center space-x-1 hover:text-primary"
                  aria-label={getSortLabel('firstMet')}
                >
                  <span>First Met</span>
                  {sortConfig.field === 'firstMet' && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('lastSeen')}
                  className="flex items-center space-x-1 hover:text-primary"
                  aria-label={getSortLabel('lastSeen')}
                >
                  <span>Last Seen</span>
                  {sortConfig.field === 'lastSeen' && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('interactionCount')}
                  className="flex items-center space-x-1 hover:text-primary"
                  aria-label={getSortLabel('interactionCount')}
                >
                  <span>Interactions</span>
                  {sortConfig.field === 'interactionCount' && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('relationshipType')}
                  className="flex items-center space-x-1 hover:text-primary"
                  aria-label={getSortLabel('relationshipType')}
                >
                  <span>Relationship</span>
                  {sortConfig.field === 'relationshipType' && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMemories.map((memory) => (
              <TableRow key={memory.id}>
                <TableCell className="font-medium">{memory.name}</TableCell>
                <TableCell>{formatDate(memory.firstMet)}</TableCell>
                <TableCell>{formatDate(memory.lastSeen)}</TableCell>
                <TableCell>{memory.interactionCount}</TableCell>
                <TableCell>
                  <span className="capitalize">{memory.relationshipType}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(memory)}
                        aria-label={`Edit ${memory.name}`}
                      >
                        Edit
                      </Button>
                    )}
                    {onViewInteractions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewInteractions(memory.id)}
                        aria-label={`View interactions for ${memory.name}`}
                      >
                        View
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(memory.id)}
                        aria-label={`Delete ${memory.name}`}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedMemories.length)} of{' '}
            {sortedMemories.length} memories
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
