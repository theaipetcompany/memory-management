import { ImageManagement } from '@/components/image-management';
import { LatestRunningJob } from '@/components/latest-running-job';

export default function Learning() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Learning & Training
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload images with annotations for fine-tuning
          </p>
        </div>

        <div className="space-y-8">
          {/* Image Management */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Image Management
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <ImageManagement />
            </div>
          </section>

          {/* Latest Running Job */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Training Status
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <LatestRunningJob />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
