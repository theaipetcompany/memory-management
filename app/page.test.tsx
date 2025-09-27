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
      <button disabled={images.length === 0}>
        Submit to OpenAI ({images.length} images)
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
        screen.getByText('Submit to OpenAI (1 images)')
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
      const button = screen.getByText('Submit to OpenAI (0 images)');
      expect(button).toBeDisabled();
    });
  });
});
