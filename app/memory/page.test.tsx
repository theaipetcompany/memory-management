import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemoryPage from './page';

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
  FaceUpload: ({ onImageUpload, onFaceDetected, loading }: any) => (
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

    expect(screen.getByText('Memory Stats: 3 memories')).toBeInTheDocument();
    expect(screen.getByText('Memory Table: 3 memories')).toBeInTheDocument();
  });
});
