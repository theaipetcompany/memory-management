import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemoryPage from './page';

// Mock the useMemories hook
jest.mock('@/hooks/use-memories', () => ({
  useMemories: () => ({
    memories: [
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
    ],
    loading: false,
    error: null,
    pagination: null,
    refetch: jest.fn(),
    createMemory: jest.fn(),
    updateMemory: jest.fn(),
    deleteMemory: jest.fn(),
  }),
}));

// Mock the components
jest.mock('@/components/memory-stats', () => ({
  MemoryStats: ({ memories }: { memories: any[] }) => (
    <div data-testid="memory-stats">
      Memory Stats: {memories.length} memories
    </div>
  ),
}));

jest.mock('@/components/memory-table', () => ({
  MemoryTable: ({ memories, onEdit, onDelete, onViewInteractions }: any) => (
    <div data-testid="memory-table">
      Memory Table: {memories.length} memories
      <button onClick={() => onEdit?.(memories[0])}>Edit</button>
      <button onClick={() => onDelete?.('1')}>Delete</button>
      <button onClick={() => onViewInteractions?.('1')}>
        View Interactions
      </button>
    </div>
  ),
}));

jest.mock('@/components/face-upload', () => ({
  FaceUpload: ({
    onImageUpload,
    onFaceDetected,
    onFaceLinked,
    loading,
  }: any) => (
    <div data-testid="face-upload">
      Face Upload Component
      {loading && <div>Loading...</div>}
    </div>
  ),
}));

describe('Memory Page', () => {
  it('renders the memory management page', () => {
    render(<MemoryPage />);

    expect(screen.getByText('Memory Management')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Manage your pet memories and test face recognition capabilities'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Memory Statistics')).toBeInTheDocument();
    expect(screen.getByText('Memory Entries')).toBeInTheDocument();
    expect(screen.getByText('Face Recognition Testing')).toBeInTheDocument();
  });

  it('renders all components', () => {
    render(<MemoryPage />);

    expect(screen.getByTestId('memory-stats')).toBeInTheDocument();
    expect(screen.getByTestId('memory-table')).toBeInTheDocument();
    expect(screen.getByTestId('face-upload')).toBeInTheDocument();
  });

  it('displays mock data correctly', () => {
    render(<MemoryPage />);

    expect(screen.getByText('Memory Stats: 2 memories')).toBeInTheDocument();
    expect(screen.getByText('Memory Table: 2 memories')).toBeInTheDocument();
  });
});
