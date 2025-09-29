import { FineTuningJobsList } from '@/components/fine-tuning-jobs-list';

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fine-tuning Jobs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor your fine-tuning job progress
          </p>
        </div>

        <div className="space-y-8">
          {/* Fine-tuning Jobs List */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Job History
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <FineTuningJobsList />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
