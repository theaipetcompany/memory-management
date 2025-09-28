# Phase 4: UI Components

## Overview

This phase implements the user interface components for the AI Pet Memory system. The components provide a web-based dashboard for managing pet memories, uploading faces, and testing recognition capabilities.

## Component Architecture

### Component Hierarchy

```
MemoryDashboard
├── MemoryStats
├── MemoryTable
├── AddMemoryModal
└── RecognitionTestPanel
    ├── FaceUpload
    ├── RecognitionResults
    └── LearningMode
```

### Design Principles

- **Reuse UI Components**: Only reuse components from `components/ui`
- **Independent App Components**: Keep components in `app` folder independent
- **Consistent Styling**: Use Tailwind CSS with shadcn/ui design system
- **Responsive Design**: Mobile-first approach with desktop optimization

## Memory Dashboard Component

### Main Dashboard Interface

**File**: `components/memory-dashboard.tsx`

```typescript
interface MemoryDashboardProps {
  initialMemories?: MemoryEntry[];
  onMemoryUpdate?: (memory: MemoryEntry) => void;
  onMemoryDelete?: (id: string) => void;
}

export function MemoryDashboard({
  initialMemories = [],
  onMemoryUpdate,
  onMemoryDelete,
}: MemoryDashboardProps) {
  // Component implementation
}
```

### Features

- Memory statistics display
- Memory entries table with pagination
- Add/Edit/Delete memory functionality
- Search and filtering capabilities
- Recognition testing interface

## Memory Statistics Component

### Statistics Display

**File**: `components/memory-stats.tsx`

```typescript
interface MemoryStatsProps {
  memories: MemoryEntry[];
}

export function MemoryStats({ memories }: MemoryStatsProps) {
  // Component implementation
}
```

### Statistics Included

- Total memories count
- Friends vs Family vs Acquaintances breakdown
- Recent interactions count
- Average interaction frequency
- Memory growth over time

## Memory Table Component

### Data Display Table

**File**: `components/memory-table.tsx`

```typescript
interface MemoryTableProps {
  memories: MemoryEntry[];
  onEdit?: (memory: MemoryEntry) => void;
  onDelete?: (id: string) => void;
  onViewInteractions?: (id: string) => void;
  loading?: boolean;
}

export function MemoryTable({
  memories,
  onEdit,
  onDelete,
  onViewInteractions,
  loading = false,
}: MemoryTableProps) {
  // Component implementation
}
```

### Table Features

- Sortable columns (name, first met, last seen, interactions)
- Pagination controls
- Row actions (edit, delete, view interactions)
- Empty state handling
- Loading states

## Add Memory Modal Component

### Memory Creation Interface

**File**: `components/add-memory-modal.tsx`

```typescript
interface AddMemoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemoryCreated?: (memory: MemoryEntry) => void;
  editingMemory?: MemoryEntry;
}

export function AddMemoryModal({
  open,
  onOpenChange,
  onMemoryCreated,
  editingMemory,
}: AddMemoryModalProps) {
  // Component implementation
}
```

### Form Fields

- Name input (required)
- Image upload with preview
- Introduced by field
- Notes textarea
- Preferences tags input
- Relationship type selector
- Tags input

## Face Upload Component

### Image Upload Interface

**File**: `components/face-upload.tsx`

```typescript
interface FaceUploadProps {
  onImageUpload: (file: File) => Promise<void>;
  onFaceDetected?: (faces: DetectedFace[]) => void;
  loading?: boolean;
  error?: string;
}

export function FaceUpload({
  onImageUpload,
  onFaceDetected,
  loading = false,
  error,
}: FaceUploadProps) {
  // Component implementation
}
```

### Features

- Drag and drop file upload
- Image preview with face detection overlay
- File format validation
- Image dimension validation
- Upload progress indication
- Error handling and display

## Recognition Test Panel Component

### Testing Interface

**File**: `components/recognition-test-panel.tsx`

```typescript
interface RecognitionTestPanelProps {
  onRecognitionResult?: (result: RecognitionResult) => void;
  onLearningComplete?: (memory: MemoryEntry) => void;
}

export function RecognitionTestPanel({
  onRecognitionResult,
  onLearningComplete,
}: RecognitionTestPanelProps) {
  // Component implementation
}
```

### Testing Modes

- **Recognition Mode**: Test face recognition with uploaded images
- **Learning Mode**: Teach new faces to the system
- **Batch Testing**: Test multiple images at once

## Recognition Results Component

### Results Display

**File**: `components/recognition-results.tsx`

```typescript
interface RecognitionResultsProps {
  results: RecognitionResult[];
  loading?: boolean;
  onLearnNew?: (image: File, name: string) => void;
}

export function RecognitionResults({
  results,
  loading = false,
  onLearnNew,
}: RecognitionResultsProps) {
  // Component implementation
}
```

### Results Features

- Confidence score visualization
- Similarity score display
- Memory metadata preview
- Learn new face option
- Export results functionality

## TDD Test Cases

### Memory Dashboard Tests

**File**: `components/memory-dashboard.test.tsx`

```typescript
describe('Memory Dashboard', () => {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('rendering', () => {
    it('should display memory entries in table format', () => {
      render(<MemoryDashboard initialMemories={mockMemories} />);

      expect(screen.getByText('Anna')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // interaction count
    });

    it('should show memory statistics', () => {
      render(<MemoryDashboard initialMemories={mockMemories} />);

      expect(screen.getByText('Total Memories')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // total count
    });

    it('should handle empty state', () => {
      render(<MemoryDashboard initialMemories={[]} />);

      expect(screen.getByText('No memories found')).toBeInTheDocument();
      expect(screen.getByText('Add your first memory')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should allow adding new memories', async () => {
      const user = userEvent.setup();
      render(<MemoryDashboard />);

      const addButton = screen.getByText('Add Memory');
      await user.click(addButton);

      expect(screen.getByText('Add New Memory')).toBeInTheDocument();
    });

    it('should allow editing existing memories', async () => {
      const user = userEvent.setup();
      const onMemoryUpdate = jest.fn();

      render(
        <MemoryDashboard
          initialMemories={mockMemories}
          onMemoryUpdate={onMemoryUpdate}
        />
      );

      const editButton = screen.getByLabelText('Edit Anna');
      await user.click(editButton);

      expect(screen.getByText('Edit Memory')).toBeInTheDocument();
    });

    it('should allow deleting memories', async () => {
      const user = userEvent.setup();
      const onMemoryDelete = jest.fn();

      render(
        <MemoryDashboard
          initialMemories={mockMemories}
          onMemoryDelete={onMemoryDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete Anna');
      await user.click(deleteButton);

      expect(
        screen.getByText('Are you sure you want to delete this memory?')
      ).toBeInTheDocument();
    });

    it('should allow searching memories', async () => {
      const user = userEvent.setup();
      render(<MemoryDashboard initialMemories={mockMemories} />);

      const searchInput = screen.getByPlaceholderText('Search memories...');
      await user.type(searchInput, 'Anna');

      expect(screen.getByText('Anna')).toBeInTheDocument();
    });

    it('should allow filtering by relationship type', async () => {
      const user = userEvent.setup();
      render(<MemoryDashboard initialMemories={mockMemories} />);

      const filterSelect = screen.getByLabelText('Filter by relationship');
      await user.selectOptions(filterSelect, 'friend');

      expect(screen.getByText('Anna')).toBeInTheDocument();
    });
  });
});
```

### Memory Stats Tests

**File**: `components/memory-stats.test.tsx`

```typescript
describe('Memory Stats', () => {
  const mockMemories: MemoryEntry[] = [
    {
      id: '1',
      name: 'Anna',
      relationshipType: 'friend',
      interactionCount: 5,
      // ... other fields
    },
    {
      id: '2',
      name: 'Bob',
      relationshipType: 'family',
      interactionCount: 3,
      // ... other fields
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
      expect(screen.getByText('1')).toBeInTheDocument(); // Anna
      expect(screen.getByText('Family')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Bob
    });

    it('should display total interactions', () => {
      render(<MemoryStats memories={mockMemories} />);

      expect(screen.getByText('Total Interactions')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // 5 + 3
    });

    it('should handle empty memories array', () => {
      render(<MemoryStats memories={[]} />);

      expect(screen.getByText('Total Memories')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
```

### Memory Table Tests

**File**: `components/memory-table.test.tsx`

```typescript
describe('Memory Table', () => {
  const mockMemories: MemoryEntry[] = [
    {
      id: '1',
      name: 'Anna',
      firstMet: new Date('2025-01-20'),
      lastSeen: new Date('2025-01-25'),
      interactionCount: 5,
      relationshipType: 'friend',
      // ... other fields
    },
  ];

  describe('table rendering', () => {
    it('should display memory data in table rows', () => {
      render(<MemoryTable memories={mockMemories} />);

      expect(screen.getByText('Anna')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('friend')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<MemoryTable memories={[]} loading={true} />);

      expect(screen.getByText('Loading memories...')).toBeInTheDocument();
    });

    it('should show empty state when no memories', () => {
      render(<MemoryTable memories={[]} />);

      expect(screen.getByText('No memories found')).toBeInTheDocument();
    });
  });

  describe('table interactions', () => {
    it('should allow sorting by name', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={mockMemories} />);

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      // Verify sorting indicator appears
      expect(screen.getByLabelText('Sorted by name')).toBeInTheDocument();
    });

    it('should allow sorting by interaction count', async () => {
      const user = userEvent.setup();
      render(<MemoryTable memories={mockMemories} />);

      const interactionsHeader = screen.getByText('Interactions');
      await user.click(interactionsHeader);

      expect(
        screen.getByLabelText('Sorted by interactions')
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
  });
});
```

### Face Upload Tests

**File**: `components/face-upload.test.tsx`

```typescript
describe('Face Upload Component', () => {
  const mockOnImageUpload = jest.fn();
  const mockOnFaceDetected = jest.fn();

  beforeEach(() => {
    mockOnImageUpload.mockClear();
    mockOnFaceDetected.mockClear();
  });

  describe('file upload', () => {
    it('should accept image files only', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      expect(mockOnImageUpload).toHaveBeenCalledWith(imageFile);
    });

    it('should validate image dimensions', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const invalidFile = new File(['invalid'], 'test.txt', {
        type: 'text/plain',
      });

      await user.upload(fileInput, invalidFile);

      expect(
        screen.getByText('Please upload a valid image file')
      ).toBeInTheDocument();
    });

    it('should show upload progress', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          loading={true}
        />
      );

      expect(screen.getByText('Processing image...')).toBeInTheDocument();
    });
  });

  describe('face detection', () => {
    it('should detect faces in uploaded images', async () => {
      const user = userEvent.setup();
      const mockFaces = [
        { x: 100, y: 100, width: 200, height: 200, confidence: 0.95 },
      ];

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      // Mock face detection result
      mockOnFaceDetected.mockImplementation(() => {
        return Promise.resolve(mockFaces);
      });

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      expect(mockOnFaceDetected).toHaveBeenCalled();
    });

    it('should handle images without faces', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      mockOnFaceDetected.mockResolvedValue([]);

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      expect(
        screen.getByText('No faces detected in image')
      ).toBeInTheDocument();
    });

    it('should handle multiple faces', async () => {
      const user = userEvent.setup();
      const mockFaces = [
        { x: 100, y: 100, width: 200, height: 200, confidence: 0.95 },
        { x: 300, y: 100, width: 200, height: 200, confidence: 0.9 },
      ];

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      mockOnFaceDetected.mockResolvedValue(mockFaces);

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      expect(screen.getByText('2 faces detected')).toBeInTheDocument();
    });
  });
});
```

### Recognition Test Panel Tests

**File**: `components/recognition-test-panel.test.tsx`

```typescript
describe('Recognition Test Panel', () => {
  const mockOnRecognitionResult = jest.fn();
  const mockOnLearningComplete = jest.fn();

  beforeEach(() => {
    mockOnRecognitionResult.mockClear();
    mockOnLearningComplete.mockClear();
  });

  describe('face recognition', () => {
    it('should recognize known faces', async () => {
      const user = userEvent.setup();
      render(
        <RecognitionTestPanel
          onRecognitionResult={mockOnRecognitionResult}
          onLearningComplete={mockOnLearningComplete}
        />
      );

      const fileInput = screen.getByLabelText('Upload test image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      // Mock recognition result
      const mockResult = {
        matches: [
          {
            memoryId: '1',
            name: 'Anna',
            similarity: 0.95,
            confidence: 'high',
          },
        ],
        processingTime: 200,
      };

      mockOnRecognitionResult.mockResolvedValue(mockResult);

      expect(mockOnRecognitionResult).toHaveBeenCalled();
    });

    it('should show confidence scores', async () => {
      const user = userEvent.setup();
      render(
        <RecognitionTestPanel
          onRecognitionResult={mockOnRecognitionResult}
          onLearningComplete={mockOnLearningComplete}
        />
      );

      // Mock high confidence result
      const mockResult = {
        matches: [
          {
            memoryId: '1',
            name: 'Anna',
            similarity: 0.95,
            confidence: 'high',
          },
        ],
      };

      mockOnRecognitionResult.mockResolvedValue(mockResult);

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should handle recognition failures', async () => {
      const user = userEvent.setup();
      render(
        <RecognitionTestPanel
          onRecognitionResult={mockOnRecognitionResult}
          onLearningComplete={mockOnLearningComplete}
        />
      );

      mockOnRecognitionResult.mockRejectedValue(
        new Error('Recognition failed')
      );

      const fileInput = screen.getByLabelText('Upload test image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      expect(screen.getByText('Recognition failed')).toBeInTheDocument();
    });
  });

  describe('learning mode', () => {
    it('should allow teaching new faces', async () => {
      const user = userEvent.setup();
      render(
        <RecognitionTestPanel
          onRecognitionResult={mockOnRecognitionResult}
          onLearningComplete={mockOnLearningComplete}
        />
      );

      const learningModeButton = screen.getByText('Learning Mode');
      await user.click(learningModeButton);

      expect(screen.getByText('Teach New Face')).toBeInTheDocument();
    });

    it('should update memory after learning', async () => {
      const user = userEvent.setup();
      render(
        <RecognitionTestPanel
          onRecognitionResult={mockOnRecognitionResult}
          onLearningComplete={mockOnLearningComplete}
        />
      );

      const learningModeButton = screen.getByText('Learning Mode');
      await user.click(learningModeButton);

      const nameInput = screen.getByLabelText('Name');
      await user.type(nameInput, 'Anna');

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });
      await user.upload(fileInput, imageFile);

      const learnButton = screen.getByText('Learn Face');
      await user.click(learnButton);

      expect(mockOnLearningComplete).toHaveBeenCalled();
    });
  });
});
```

## Implementation Steps

### Step 1: Core Dashboard Components

1. **Create MemoryDashboard** component with basic layout
2. **Implement MemoryStats** component for statistics display
3. **Build MemoryTable** component with sorting and pagination
4. **Add AddMemoryModal** for memory creation/editing
5. **Write comprehensive tests** for all components

### Step 2: Face Upload Components

1. **Create FaceUpload** component with drag-and-drop
2. **Add image validation** and preview functionality
3. **Implement face detection** overlay
4. **Add error handling** and loading states
5. **Write comprehensive tests** for upload functionality

### Step 3: Recognition Testing Components

1. **Build RecognitionTestPanel** with multiple modes
2. **Create RecognitionResults** component for displaying results
3. **Add LearningMode** interface for teaching new faces
4. **Implement confidence visualization**
5. **Write comprehensive tests** for recognition features

### Step 4: Integration & Polish

1. **Connect components** to API endpoints from Phase 3
2. **Add error handling** and user feedback
3. **Implement responsive design** for mobile devices
4. **Add accessibility features** (ARIA labels, keyboard navigation)
5. **Write integration tests** for complete user flows

## Styling & Design

### Design System

- **Colors**: Use shadcn/ui color palette
- **Typography**: Consistent font sizes and weights
- **Spacing**: Tailwind spacing scale
- **Components**: Reuse shadcn/ui components (Button, Dialog, Input, etc.)

### Responsive Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Accessibility

- **ARIA labels** for all interactive elements
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** compliance

## Performance Requirements

- **Component Rendering**: < 100ms for initial render
- **Image Upload**: < 500ms for processing
- **Table Sorting**: < 50ms for 100+ items
- **Modal Opening**: < 200ms

## Acceptance Criteria

- [ ] All component tests pass
- [ ] Components render correctly on all screen sizes
- [ ] Accessibility requirements met
- [ ] Performance requirements satisfied
- [ ] Error handling implemented
- [ ] Loading states displayed
- [ ] User interactions work smoothly

## Next Steps

After completing Phase 4, proceed to:

- **Phase 5**: Integration & End-to-End Tests
- **Phase 6**: Advanced Features & Optimization

Each phase builds upon the UI components established in this phase.
