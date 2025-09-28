import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryStats } from './memory-stats';
import { MemoryEntry } from '@/types/memory';

describe('Memory Stats', () => {
  const mockMemories: MemoryEntry[] = [
    {
      id: '1',
      name: 'Anna',
      embedding: new Array(768).fill(0.1),
      firstMet: new Date('2025-01-20'),
      lastSeen: new Date('2025-01-25'),
      interactionCount: 5,
      preferences: ['coffee'],
      tags: ['friend'],
      relationshipType: 'friend',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-25'),
    },
    {
      id: '2',
      name: 'Bob',
      embedding: new Array(768).fill(0.2),
      firstMet: new Date('2025-01-15'),
      lastSeen: new Date('2025-01-24'),
      interactionCount: 3,
      preferences: ['tea'],
      tags: ['family'],
      relationshipType: 'family',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-24'),
    },
  ];

  describe('statistics calculation', () => {
    it('should display total memories count', () => {
      render(<MemoryStats memories={mockMemories} />);

      expect(screen.getByText('Total Memories')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display relationship type breakdown', () => {
      render(<MemoryStats memories={mockMemories} />);

      expect(screen.getByText('Friends')).toBeInTheDocument();
      expect(screen.getByLabelText('Friends count')).toHaveTextContent('1'); // Anna
      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(screen.getByLabelText('Family count')).toHaveTextContent('1'); // Bob
    });

    it('should display total interactions', () => {
      render(<MemoryStats memories={mockMemories} />);

      expect(screen.getByText('Total Interactions')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // 5 + 3
    });

    it('should handle empty memories array', () => {
      render(<MemoryStats memories={[]} />);

      expect(screen.getByText('Total Memories')).toBeInTheDocument();
      expect(screen.getByLabelText('Total memories count')).toHaveTextContent(
        '0'
      );
    });

    it('should display acquaintances count', () => {
      const memoriesWithAcquaintance: MemoryEntry[] = [
        ...mockMemories,
        {
          id: '3',
          name: 'Charlie',
          embedding: new Array(768).fill(0.3),
          firstMet: new Date('2025-01-10'),
          lastSeen: new Date('2025-01-23'),
          interactionCount: 1,
          preferences: [],
          tags: ['acquaintance'],
          relationshipType: 'acquaintance',
          createdAt: new Date('2025-01-10'),
          updatedAt: new Date('2025-01-23'),
        },
      ];

      render(<MemoryStats memories={memoriesWithAcquaintance} />);

      expect(screen.getByText('Acquaintances')).toBeInTheDocument();
      expect(screen.getByLabelText('Acquaintances count')).toHaveTextContent(
        '1'
      ); // Charlie
    });

    it('should calculate average interactions per memory', () => {
      render(<MemoryStats memories={mockMemories} />);

      expect(screen.getByText('Avg Interactions')).toBeInTheDocument();
      expect(screen.getByText('4.0')).toBeInTheDocument(); // (5 + 3) / 2
    });

    it('should display recent activity count', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1); // Yesterday

      const memoriesWithRecent: MemoryEntry[] = [
        ...mockMemories,
        {
          id: '3',
          name: 'David',
          embedding: new Array(768).fill(0.3),
          firstMet: new Date('2025-01-10'),
          lastSeen: recentDate,
          interactionCount: 2,
          preferences: [],
          tags: ['friend'],
          relationshipType: 'friend',
          createdAt: new Date('2025-01-10'),
          updatedAt: recentDate,
        },
      ];

      render(<MemoryStats memories={memoriesWithRecent} />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Memories with recent activity')
      ).toHaveTextContent('1'); // David seen recently
    });
  });

  describe('rendering', () => {
    it('should render all statistics cards', () => {
      render(<MemoryStats memories={mockMemories} />);

      // Check for all main statistics cards
      expect(screen.getByText('Total Memories')).toBeInTheDocument();
      expect(screen.getByText('Friends')).toBeInTheDocument();
      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(screen.getByText('Total Interactions')).toBeInTheDocument();
      expect(screen.getByText('Avg Interactions')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should have proper accessibility labels', () => {
      render(<MemoryStats memories={mockMemories} />);

      // Check for proper ARIA labels
      expect(screen.getByLabelText('Total memories count')).toBeInTheDocument();
      expect(screen.getByLabelText('Friends count')).toBeInTheDocument();
      expect(screen.getByLabelText('Family count')).toBeInTheDocument();
    });

    it('should display zero values correctly', () => {
      render(<MemoryStats memories={[]} />);

      expect(screen.getByLabelText('Total memories count')).toHaveTextContent(
        '0'
      );
      expect(
        screen.getByLabelText('Total interactions count')
      ).toHaveTextContent('0');
      expect(
        screen.getByLabelText('Average interactions per memory')
      ).toHaveTextContent('0.0');
    });
  });
});
