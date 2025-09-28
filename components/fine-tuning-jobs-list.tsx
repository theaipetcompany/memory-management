'use client';

import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';

interface FineTuningJob {
  id: string;
  status:
    | 'validating_files'
    | 'queued'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'cancelled';
  model: string;
  created_at: number;
  finished_at: number | null;
  training_file: string;
  validation_file: string | null;
  result_files: string[];
  hyperparameters: {
    n_epochs: number;
  };
  trained_tokens: number | null;
  error: {
    code: string;
    message: string;
  } | null;
}

interface FineTuningJobsResponse {
  jobs: FineTuningJob[];
  total: number;
}

export function FineTuningJobsList() {
  const [jobs, setJobs] = useState<FineTuningJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await fetcher<FineTuningJobsResponse>(
        '/api/fine-tuning-jobs'
      );
      if (data) {
        // Filter for running jobs and sort by creation date (latest first)
        const runningJobs = data.jobs
          .filter((job) => job.status === 'running')
          .sort((a, b) => b.created_at - a.created_at);

        // Show only the latest running job
        setJobs(runningJobs.slice(0, 1));
      }
    } catch (error) {
      console.error('Error fetching fine-tuning jobs:', error);
      toast.error('Failed to load fine-tuning jobs', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusColor = (status: FineTuningJob['status']) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      case 'queued':
        return 'text-yellow-600 bg-yellow-100';
      case 'validating_files':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
          Running Fine-Tuning Jobs
        </h2>
        <div className="text-center text-slate-600 dark:text-slate-300">
          Loading fine-tuning jobs...
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full max-w-6xl">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
          Running Fine-Tuning Jobs
        </h2>
        <div className="text-center text-slate-600 dark:text-slate-300">
          No running fine-tuning jobs found
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
        Running Fine-Tuning Jobs ({jobs.length})
      </h2>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  {job.id}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Model: {job.model}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  job.status
                )}`}
              >
                {job.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Created:</span>{' '}
                  {formatDate(job.created_at)}
                </p>
                {job.finished_at && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Finished:</span>{' '}
                    {formatDate(job.finished_at)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Epochs:</span>{' '}
                  {job.hyperparameters.n_epochs}
                </p>
                {job.trained_tokens && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Trained Tokens:</span>{' '}
                    {job.trained_tokens.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {job.error && job.error.message && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <span className="font-medium">Error:</span>{' '}
                  {job.error.message}
                </p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <a
                href={`https://platform.openai.com/finetune/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View on OpenAI Platform
              </a>
              {job.result_files.length > 0 && (
                <span className="text-green-600 text-sm">
                  ✓ Results available
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
