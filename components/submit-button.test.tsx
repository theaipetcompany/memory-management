import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmitButton } from './submit-button';

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

const mockImages = [
  {
    id: '1',
    filename: 'test1.jpg',
    annotation: 'A cat sitting',
    filePath: '/uploads/test1.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    createdAt: new Date(),
  },
  {
    id: '2',
    filename: 'test2.jpg',
    annotation: 'A dog running',
    filePath: '/uploads/test2.jpg',
    fileSize: 2048000,
    mimeType: 'image/jpeg',
    createdAt: new Date(),
  },
];

// Create 10+ images for tests that need minimum requirement
const mockImagesWithMinimum = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  filename: `test${i + 1}.jpg`,
  annotation: `Test image ${i + 1}`,
  filePath: `/uploads/test${i + 1}.jpg`,
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  createdAt: new Date(),
}));

describe('SubmitButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render submit button', () => {
    render(<SubmitButton images={mockImages} />);

    expect(screen.getByText('Upload 8 more images (2/10)')).toBeInTheDocument();
  });

  test('should be disabled when no images', () => {
    render(<SubmitButton images={[]} />);

    const button = screen.getByText('Upload 10 more images (0/10)');
    expect(button).toBeDisabled();
  });

  test('should be enabled when 10+ images exist', () => {
    render(<SubmitButton images={mockImagesWithMinimum} />);

    const button = screen.getByText('Submit 10 Images to OpenAI');
    expect(button).toBeEnabled();
  });

  test('should submit images to OpenAI', async () => {
    const mockJob = {
      id: 'job-123',
      status: 'pending',
      openaiJobId: 'ftjob-abc123',
      createdAt: new Date(),
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockJob),
    });

    render(<SubmitButton images={mockImagesWithMinimum} />);

    const button = screen.getByText('Submit 10 Images to OpenAI');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/jobs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          imageIds: mockImagesWithMinimum.map((img) => img.id),
        }),
      });
    });
  });

  test('should show loading state during submission', async () => {
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({}),
              }),
            100
          )
        )
    );

    render(<SubmitButton images={mockImagesWithMinimum} />);

    const button = screen.getByText('Submit 10 Images to OpenAI');
    fireEvent.click(button);

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('should show success toast on successful submission', async () => {
    const { toast } = require('sonner');

    const mockJob = {
      id: 'job-123',
      status: 'pending',
      openaiJobId: 'ftjob-abc123',
      createdAt: new Date(),
      trainingDataSize: 10,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockJob),
    });

    render(<SubmitButton images={mockImagesWithMinimum} />);

    const button = screen.getByText('Submit 10 Images to OpenAI');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Fine-tuning job submitted successfully!',
        {
          description: 'Processing 10 images',
        }
      );
    });
  });

  test('should handle submission error', async () => {
    const { toast } = require('sonner');

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Submission failed' }),
    });

    render(<SubmitButton images={mockImagesWithMinimum} />);

    const button = screen.getByText('Submit 10 Images to OpenAI');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Submission Failed', {
        description: 'Submission failed',
        duration: 5000,
      });
    });
  });

  test('should call onClearImages after successful submission', async () => {
    const mockOnClearImages = jest.fn();
    const mockJob = {
      id: 'job-123',
      status: 'pending',
      openaiJobId: 'ftjob-abc123',
      createdAt: new Date(),
      trainingDataSize: 10,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockJob),
    });

    render(
      <SubmitButton
        images={mockImagesWithMinimum}
        onClearImages={mockOnClearImages}
      />
    );

    const button = screen.getByText('Submit 10 Images to OpenAI');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnClearImages).toHaveBeenCalled();
    });
  });
});
