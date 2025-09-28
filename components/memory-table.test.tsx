import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryTable } from './memory-table';
import { MemoryEntry } from '@/types/memory';

describe('Memory Table', () => {
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

  describe('table rendering', () => {
    it('should display memory data in table rows', () => {
      render(<MemoryTable memories={mockMemories} />);

      expect(screen.getByText('Anna')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('friend')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('family')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<MemoryTable memories={[]} loading={true} />);

      expect(screen.getByText('Loading memories...')).toBeInTheDocument();
    });

    it('should show empty state when no memories', () => {
      render(<MemoryTable memories={[]} />);

      expect(screen.getByText('No memories found')).toBeInTheDocument();
    });

    it('should display table headers', () => {
      render(<MemoryTable memories={mockMemories} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('First Met')).toBeInTheDocument();
      expect(screen.getByText('Last Seen')).toBeInTheDocument();
      expect(screen.getByText('Interactions')).toBeInTheDocument();
      expect(screen.getByText('Relationship')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(<MemoryTable memories={mockMemories} />);

      // Check that dates are displayed in a readable format
      expect(screen.getByText('Jan 20, 2025')).toBeInTheDocument(); // firstMet
      expect(screen.getByText('Jan 25, 2025')).toBeInTheDocument(); // lastSeen
    });
  });

  describe('table interactions', () => {
    it('should allow sorting by name', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={mockMemories} />);

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      // Verify sorting indicator appears
      expect(
        screen.getByLabelText('Sorted by name descending')
      ).toBeInTheDocument();
    });

    it('should allow sorting by interaction count', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={mockMemories} />);

      const interactionsHeader = screen.getByText('Interactions');
      await user.click(interactionsHeader);

      expect(
        screen.getByLabelText('Sorted by interactionCount ascending')
      ).toBeInTheDocument();
    });

    it('should toggle sort direction on second click', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={mockMemories} />);

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);
      expect(
        screen.getByLabelText('Sorted by name descending')
      ).toBeInTheDocument();

      await user.click(nameHeader);
      expect(
        screen.getByLabelText('Sorted by name ascending')
      ).toBeInTheDocument();
    });

    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();

      render(<MemoryTable memories={mockMemories} onEdit={onEdit} />);

      const editButton = screen.getByLabelText('Edit Anna');
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockMemories[0]);
    });

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();

      render(<MemoryTable memories={mockMemories} onDelete={onDelete} />);

      const deleteButton = screen.getByLabelText('Delete Anna');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith('1');
    });

    it('should call onViewInteractions when view interactions button clicked', async () => {
      const user = userEvent.setup();
      const onViewInteractions = jest.fn();

      render(
        <MemoryTable
          memories={mockMemories}
          onViewInteractions={onViewInteractions}
        />
      );

      const viewButton = screen.getByLabelText('View interactions for Anna');
      await user.click(viewButton);

      expect(onViewInteractions).toHaveBeenCalledWith('1');
    });

    it('should show action buttons for each memory', () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      const onViewInteractions = jest.fn();

      render(
        <MemoryTable
          memories={mockMemories}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewInteractions={onViewInteractions}
        />
      );

      // Check that action buttons are present for each memory
      expect(screen.getByLabelText('Edit Anna')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Anna')).toBeInTheDocument();
      expect(
        screen.getByLabelText('View interactions for Anna')
      ).toBeInTheDocument();

      expect(screen.getByLabelText('Edit Bob')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Bob')).toBeInTheDocument();
      expect(
        screen.getByLabelText('View interactions for Bob')
      ).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    const manyMemories: MemoryEntry[] = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Person ${i + 1}`,
      embedding: new Array(768).fill(0.1),
      firstMet: new Date('2025-01-20'),
      lastSeen: new Date('2025-01-25'),
      interactionCount: i + 1,
      preferences: [],
      tags: ['friend'],
      relationshipType: 'friend' as const,
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-25'),
    }));

    it('should show pagination controls when there are many memories', () => {
      render(<MemoryTable memories={manyMemories} />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={manyMemories} />);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    it('should navigate to previous page', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={manyMemories} />);

      // Go to page 2 first
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Then go back to page 1
      const prevButton = screen.getByText('Previous');
      await user.click(prevButton);

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      render(<MemoryTable memories={manyMemories} />);

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={manyMemories} />);

      // Navigate to last page
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
      await user.click(nextButton);

      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', () => {
      render(<MemoryTable memories={mockMemories} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(6); // Name, First Met, Last Seen, Interactions, Relationship, Actions
    });

    it('should have proper ARIA labels for action buttons', () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      const onViewInteractions = jest.fn();

      render(
        <MemoryTable
          memories={mockMemories}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewInteractions={onViewInteractions}
        />
      );

      expect(screen.getByLabelText('Edit Anna')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Anna')).toBeInTheDocument();
      expect(
        screen.getByLabelText('View interactions for Anna')
      ).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();

      render(<MemoryTable memories={mockMemories} onEdit={onEdit} />);

      const editButton = screen.getByLabelText('Edit Anna');
      editButton.focus();

      expect(editButton).toHaveFocus();

      await user.keyboard('{Enter}');
      // Button should be clickable with keyboard
      expect(onEdit).toHaveBeenCalledWith(mockMemories[0]);
    });
  });
});
