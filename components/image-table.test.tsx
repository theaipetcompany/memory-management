import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageTable } from './image-table';

const mockImages = [
  {
    id: '1',
    filename: 'image1.jpg',
    annotation: 'A cat sitting on a chair',
    filePath: '/uploads/image1.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    filename: 'image2.jpg',
    annotation: 'A dog playing in the park',
    filePath: '/uploads/image2.jpg',
    fileSize: 2048000,
    mimeType: 'image/jpeg',
    createdAt: new Date('2024-01-02'),
  },
];

const mockDeleteImage = jest.fn();
const mockUpdateAnnotation = jest.fn();

describe('ImageTable', () => {
  beforeEach(() => {
    mockDeleteImage.mockClear();
    mockUpdateAnnotation.mockClear();
  });

  test('should display images', () => {
    render(
      <ImageTable
        images={mockImages}
        onDeleteImage={mockDeleteImage}
        onUpdateAnnotation={mockUpdateAnnotation}
      />
    );
    expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByText('image2.jpg')).toBeInTheDocument();
    expect(screen.getByText('A cat sitting on a chair')).toBeInTheDocument();
    expect(screen.getByText('A dog playing in the park')).toBeInTheDocument();
  });

  test('should delete image', () => {
    render(
      <ImageTable
        images={mockImages}
        onDeleteImage={mockDeleteImage}
        onUpdateAnnotation={mockUpdateAnnotation}
      />
    );
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(mockDeleteImage).toHaveBeenCalledWith('1');
  });

  test('should show empty state when no images', () => {
    render(
      <ImageTable
        images={[]}
        onDeleteImage={mockDeleteImage}
        onUpdateAnnotation={mockUpdateAnnotation}
      />
    );
    expect(screen.getByText('No images uploaded yet')).toBeInTheDocument();
  });

  test('should allow editing annotations', async () => {
    const user = userEvent.setup();
    render(
      <ImageTable
        images={mockImages}
        onDeleteImage={mockDeleteImage}
        onUpdateAnnotation={mockUpdateAnnotation}
      />
    );

    // Click on annotation to start editing
    const annotationCell = screen.getByText('A cat sitting on a chair');
    await user.click(annotationCell);

    // Should show input field
    const input = screen.getByDisplayValue('A cat sitting on a chair');
    expect(input).toBeInTheDocument();

    // Use fireEvent to set the value directly
    fireEvent.change(input, { target: { value: 'A cat on a chair' } });

    // Press Enter to save
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockUpdateAnnotation).toHaveBeenCalledWith(
        '1',
        'A cat on a chair'
      );
    });
  });

  test('should navigate between annotations with Tab key', async () => {
    const user = userEvent.setup();
    render(
      <ImageTable
        images={mockImages}
        onDeleteImage={mockDeleteImage}
        onUpdateAnnotation={mockUpdateAnnotation}
      />
    );

    // Click on first annotation to start editing
    const firstAnnotation = screen.getByText('A cat sitting on a chair');
    await user.click(firstAnnotation);

    // Should show input field
    const input = screen.getByDisplayValue('A cat sitting on a chair');
    expect(input).toBeInTheDocument();

    // Press Tab to move to next annotation
    await user.keyboard('{Tab}');

    await waitFor(() => {
      expect(mockUpdateAnnotation).toHaveBeenCalledWith(
        '1',
        'A cat sitting on a chair'
      );
    });

    // Should now be editing the second annotation
    const secondInput = screen.getByDisplayValue('A dog playing in the park');
    expect(secondInput).toBeInTheDocument();
  });

  test('should show placeholder for empty annotations', () => {
    const imagesWithEmptyAnnotation = [
      {
        ...mockImages[0],
        annotation: '',
      },
    ];

    render(
      <ImageTable
        images={imagesWithEmptyAnnotation}
        onDeleteImage={mockDeleteImage}
        onUpdateAnnotation={mockUpdateAnnotation}
      />
    );
    expect(screen.getByText('Click to add annotation...')).toBeInTheDocument();
  });
});
