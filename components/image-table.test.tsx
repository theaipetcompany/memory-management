import { render, screen, fireEvent } from '@testing-library/react';
import { ImageTable } from './image-table';

const mockImages = [
  {
    id: '1',
    filename: 'image1.jpg',
    annotation: 'A cat sitting on a chair',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    filename: 'image2.jpg',
    annotation: 'A dog playing in the park',
    createdAt: new Date('2024-01-02'),
  },
];

const mockDeleteImage = jest.fn();

describe('ImageTable', () => {
  beforeEach(() => {
    mockDeleteImage.mockClear();
  });

  test('should display images', () => {
    render(<ImageTable images={mockImages} onDeleteImage={mockDeleteImage} />);
    expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByText('image2.jpg')).toBeInTheDocument();
    expect(screen.getByText('A cat sitting on a chair')).toBeInTheDocument();
    expect(screen.getByText('A dog playing in the park')).toBeInTheDocument();
  });

  test('should delete image', () => {
    render(<ImageTable images={mockImages} onDeleteImage={mockDeleteImage} />);
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(mockDeleteImage).toHaveBeenCalledWith('1');
  });

  test('should show empty state when no images', () => {
    render(<ImageTable images={[]} onDeleteImage={mockDeleteImage} />);
    expect(screen.getByText('No images uploaded yet')).toBeInTheDocument();
  });
});
