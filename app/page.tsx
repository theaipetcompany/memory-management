export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-white dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-6">
          Welcome to Memory Management
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
          Your AI fine-tuning platform for creating custom models with annotated
          images. Get started by uploading your training data and managing your
          fine-tuning jobs.
        </p>
      </div>
    </main>
  );
}
