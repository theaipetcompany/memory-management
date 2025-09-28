import { FineTuningJobsList } from '@/components/fine-tuning-jobs-list';

export default function JobsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 md:p-24 bg-white dark:bg-slate-900">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
          Fine-tuning Jobs
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          Monitor your fine-tuning job progress
        </p>
      </div>

      <div className="w-full">
        <FineTuningJobsList />
      </div>
    </main>
  );
}
