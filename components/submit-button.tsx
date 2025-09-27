'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/image-table';

interface SubmitButtonProps {
  images: Image[];
}

export function SubmitButton({ images }: SubmitButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobResult, setJobResult] = useState<{
    openaiJobId: string;
    jobId: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (images.length === 0) return;

    if (images.length < 10) {
      setError('Minimum 10 images required for fine-tuning');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setJobResult(null);

    try {
      const response = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds: images.map((img) => img.id) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      const job = await response.json();
      setJobResult({
        openaiJobId: job.openaiJobId,
        jobId: job.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSubmit}
        disabled={images.length < 10 || isSubmitting}
        className="w-full"
      >
        {isSubmitting
          ? 'Submitting...'
          : images.length < 10
          ? `Select ${10 - images.length} more images (${images.length}/10)`
          : `Submit ${images.length} Selected Images to OpenAI`}
      </Button>
      {images.length < 10 && (
        <p className="text-amber-600 text-sm text-center">
          ⚠️ Minimum 10 images required for OpenAI fine-tuning
        </p>
      )}
      {error && (
        <p className="text-red-500 text-sm text-center">Error: {error}</p>
      )}
      {jobResult && (
        <div className="text-center space-y-2">
          <p className="text-green-600 text-sm font-medium">
            ✅ Job submitted successfully!
          </p>
          <a
            href={`https://platform.openai.com/finetune/${jobResult.openaiJobId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            View Job on OpenAI Platform
          </a>
        </div>
      )}
    </div>
  );
}
