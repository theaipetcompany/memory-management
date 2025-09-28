import { render, screen, waitFor } from '@testing-library/react';
import { LatestRunningJob } from './latest-running-job';

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
    created_at: 1234567894, // Make this the latest
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
    status: 'running',
    model: 'gpt-4o-2024-08-06',
    created_at: 1234567893, // Make this older
    finished_at: null,
    training_file: 'file-ghi789',
    validation_file: null,
    result_files: [],
    hyperparameters: {
      n_epochs: 3,
    },
    trained_tokens: null,
    error: null,
  },
];

describe('LatestRunningJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render latest running job only', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobs: mockJobs, total: 3 }),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<LatestRunningJob />);

    await waitFor(() => {
      expect(screen.getByText('Latest Running Job')).toBeInTheDocument();
      // Should show the latest running job (def456, created_at: 1234567892)
      expect(screen.getByText('ftjob-def456')).toBeInTheDocument();
      // Should not show other jobs
      expect(screen.queryByText('ftjob-abc123')).not.toBeInTheDocument();
      expect(screen.queryByText('ftjob-ghi789')).not.toBeInTheDocument();
    });
  });

  test('should not render anything when no running jobs', async () => {
    const nonRunningJobs = mockJobs.filter(job => job.status !== 'running');
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobs: nonRunningJobs, total: 1 }),
      headers: {
        get: () => 'application/json',
      },
    });

    const { container } = render(<LatestRunningJob />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
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

    render(<LatestRunningJob />);

    expect(screen.getByText('Loading latest job status...')).toBeInTheDocument();
  });

  test('should handle error state', async () => {
    const { toast } = require('sonner');

    // Mock fetch to throw an error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<LatestRunningJob />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to load latest job status',
        {
          description: 'Network error',
          duration: 5000,
        }
      );
    });
  });

  test('should display error message when job has error', async () => {
    const jobWithError = {
      ...mockJobs[1],
      error: {
        code: 'invalid_request_error',
        message: 'Training failed',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobs: [jobWithError], total: 1 }),
      headers: {
        get: () => 'application/json',
      },
    });

    render(<LatestRunningJob />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Training failed/)).toBeInTheDocument();
    });
  });
});
