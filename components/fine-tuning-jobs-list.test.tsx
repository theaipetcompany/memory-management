import { render, screen, waitFor } from '@testing-library/react';
import { FineTuningJobsList } from './fine-tuning-jobs-list';

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

const mockJobs = [
  {
    id: 'ftjob-abc123',
    status: 'succeeded',
    model: 'gpt-4o-2024-08-06',
    created_at: 1234567890,
    finished_at: 1234567891,
    training_file: 'file-abc123',
    validation_file: null,
    result_files: ['file-result123'],
    hyperparameters: {
      n_epochs: 3,
    },
    trained_tokens: 1000,
    error: null,
  },
  {
    id: 'ftjob-def456',
    status: 'running',
    model: 'gpt-4o-2024-08-06',
    created_at: 1234567892,
    finished_at: null,
    training_file: 'file-def456',
    validation_file: null,
    result_files: [],
    hyperparameters: {
      n_epochs: 3,
    },
    trained_tokens: null,
    error: null,
  },
  {
    id: 'ftjob-ghi789',
    status: 'failed',
    model: 'gpt-4o-2024-08-06',
    created_at: 1234567893,
    finished_at: 1234567894,
    training_file: 'file-ghi789',
    validation_file: null,
    result_files: [],
    hyperparameters: {
      n_epochs: 3,
    },
    trained_tokens: null,
    error: {
      code: 'invalid_request_error',
      message: 'Training failed',
    },
  },
];

describe('FineTuningJobsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render running fine-tuning jobs only', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobs: mockJobs, total: 3 }),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<FineTuningJobsList />);

    await waitFor(() => {
      expect(
        screen.getByText('Running Fine-Tuning Jobs (1)')
      ).toBeInTheDocument();
      // Only the running job should be displayed
      expect(screen.getByText('ftjob-def456')).toBeInTheDocument();
      // Other jobs should not be displayed
      expect(screen.queryByText('ftjob-abc123')).not.toBeInTheDocument();
      expect(screen.queryByText('ftjob-ghi789')).not.toBeInTheDocument();
    });
  });

  test('should display running job status correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobs: mockJobs, total: 3 }),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<FineTuningJobsList />);

    await waitFor(() => {
      // Only running status should be displayed
      expect(screen.getByText('running')).toBeInTheDocument();
      // Other statuses should not be displayed
      expect(screen.queryByText('succeeded')).not.toBeInTheDocument();
      expect(screen.queryByText('failed')).not.toBeInTheDocument();
    });
  });

  test('should handle loading state', () => {
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ jobs: [], total: 0 }),
              }),
            100
          )
        )
    );

    render(<FineTuningJobsList />);

    expect(screen.getByText('Loading fine-tuning jobs...')).toBeInTheDocument();
  });

  test('should handle error state', async () => {
    const { toast } = require('sonner');

    // Mock fetch to throw an error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<FineTuningJobsList />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to load fine-tuning jobs',
        {
          description: 'Network error',
          duration: 5000,
        }
      );
    });
  });

  test('should display empty state when no jobs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobs: [], total: 0 }),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<FineTuningJobsList />);

    await waitFor(() => {
      expect(
        screen.getByText('No running fine-tuning jobs found')
      ).toBeInTheDocument();
    });
  });
});
