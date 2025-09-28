import { ImageManagement } from '@/components/image-management';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 md:p-24 bg-white dark:bg-slate-900">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
          OpenAI Vision Fine-tuning GUI
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          Upload images with annotations for fine-tuning
        </p>
      </div>

      <ImageManagement />
    </main>
  );
}
