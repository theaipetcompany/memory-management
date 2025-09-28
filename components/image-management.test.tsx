import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageManagement } from './image-management';

// Mock fetch
global.fetch = jest.fn();

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock components
jest.mock('@/components/image-table', () => ({
  ImageTable: ({ images, onDeleteImage, onUpdateAnnotation }: any) => (
    <div data-testid="image-table">
      {images && Array.isArray(images)
        ? images.map((image: any) => (
            <div key={image.id}>
              {image.filename} - {image.annotation}
              <button onClick={() => onDeleteImage(image.id)}>Delete</button>
            </div>
          ))
        : null}
    </div>
  ),
}));

jest.mock('@/components/add-image-modal', () => ({
  AddImageModal: ({ onAddImages }: any) => (
    <div data-testid="add-image-modal">
      <button onClick={() => onAddImages([new File([''], 'test.jpg')])}>
        Add Images
      </button>
    </div>
  ),
}));

jest.mock('@/components/submit-button', () => ({
  SubmitButton: ({ images, onClearImages }: any) => (
    <div data-testid="submit-button">
      <button
        onClick={() => {
          // Simulate successful submission and then clear images
          if (onClearImages) {
            onClearImages();
          }
        }}
        disabled={images.length < 10}
      >
        Submit
      </button>
    </div>
  ),
}));

const mockImages = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  filename: `test${i + 1}.jpg`,
  annotation: `Test image ${i + 1}`,
  filePath: `/uploads/test${i + 1}.jpg`,
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  createdAt: new Date(),
}));

describe('ImageManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should clear images when onClearImages is called', async () => {
    // Mock initial fetch for images
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockImages),
      headers: {
        get: () => 'application/json',
      },
    });

    // Mock clear images API call
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          message: 'All images cleared successfully',
          count: 2,
        }),
      headers: {
        get: () => 'application/json',
      },
    });

    // Mock fetch after clearing (should return empty array)
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<ImageManagement />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText('test1.jpg - Test image 1')).toBeInTheDocument();
    });

    // Get the submit button and trigger clear
    const submitButton = screen.getByTestId('submit-button');
    const clearButton = submitButton.querySelector('button');

    if (clearButton) {
      fireEvent.click(clearButton);
    }

    // Wait for images to be cleared
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/images/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    });

    // Verify images are cleared from the UI
    await waitFor(() => {
      expect(
        screen.queryByText('test1.jpg - Test image 1')
      ).not.toBeInTheDocument();
    });
  });

  test('should handle clear images error', async () => {
    const { toast } = require('sonner');

    // Mock initial fetch for images
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockImages),
      headers: {
        get: () => 'application/json',
      },
    });

    // Mock clear images API call failure - make it throw an error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ImageManagement />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText('test1.jpg - Test image 1')).toBeInTheDocument();
    });

    // Get the submit button and trigger clear
    const submitButton = screen.getByTestId('submit-button');
    const clearButton = submitButton.querySelector('button');

    if (clearButton) {
      fireEvent.click(clearButton);
    }

    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to clear images', {
        duration: 5000,
      });
    });
  });
});
