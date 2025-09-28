import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../app/page';

// Mock fetch
global.fetch = jest.fn();

// Mock components
jest.mock('@/components/image-table', () => ({
  ImageTable: ({ images, onDeleteImage }: any) => (
    <div data-testid="image-table">
      {images.map((image: any) => (
        <div key={image.id}>
          {image.filename} - {image.annotation}
          <button onClick={() => onDeleteImage(image.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/add-image-modal', () => ({
  AddImageModal: ({ onAddImage }: any) => (
    <div data-testid="add-image-modal">
      <button
        onClick={() =>
          onAddImage({ file: new File([''], 'test.jpg'), annotation: 'test' })
        }
      >
        Add Image
      </button>
    </div>
  ),
}));

jest.mock('@/components/submit-button', () => ({
  SubmitButton: ({ images }: any) => (
    <div data-testid="submit-button">
      <button disabled={images.length < 10}>
        {images.length < 10
          ? `Upload ${10 - images.length} more images (${images.length}/10)`
          : `Submit ${images.length} Images to OpenAI`}
      </button>
    </div>
  ),
}));

describe('Home Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render submit button with image count', async () => {
    const mockImages = [
      {
        id: '1',
        filename: 'test1.jpg',
        annotation: 'A cat sitting',
        createdAt: new Date(),
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockImages),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(
        screen.getByText('Upload 9 more images (1/10)')
      ).toBeInTheDocument();
    });
  });

  test('should disable submit button when no images', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<Home />);

    await waitFor(() => {
      const button = screen.getByText('Upload 10 more images (0/10)');
      expect(button).toBeDisabled();
    });
  });
});
