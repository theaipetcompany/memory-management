'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/image-table';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'sonner';

interface SubmitButtonProps {
  images: Image[];
}

export function SubmitButton({ images }: SubmitButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobResult, setJobResult] = useState<{
    openaiJobId: string;
    jobId: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (images.length === 0) return;

    if (images.length < 10) {
      toast.error('Minimum 10 images required for fine-tuning', {
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    setJobResult(null);

    try {
      const job = await fetcher<{
        openaiJobId: string;
        id: string;
        error?: string;
        details?: string[];
        skippedImages?: Array<{ filename: string; reason: string }>;
        trainingDataSize?: number;
      }>('/api/jobs/submit', {
        method: 'POST',
        body: JSON.stringify({ imageIds: images.map((img) => img.id) }),
      });

      if (!job) {
        throw new Error('Submission failed');
      }

      if (job.error) {
        // Handle validation errors with detailed messages
        if (job.details && job.details.length > 0) {
          job.details.forEach((detail) => {
            toast.error('Validation Error', {
              description: detail,
              duration: 5000,
            });
          });
        } else {
          toast.error('Submission Failed', {
            description: job.error,
            duration: 5000,
          });
        }

        // Show skipped images if any
        if (job.skippedImages && job.skippedImages.length > 0) {
          job.skippedImages.forEach(({ filename, reason }) => {
            toast.warning(`Skipped ${filename}`, {
              description: reason,
            });
          });
        }
        return;
      }

      setJobResult({
        openaiJobId: job.openaiJobId,
        jobId: job.id,
      });

      // Show success message with details
      const validImages = job.trainingDataSize || images.length;
      const skippedCount = job.skippedImages?.length || 0;

      toast.success('Fine-tuning job submitted successfully!', {
        description: `Processing ${validImages} images${
          skippedCount > 0 ? ` (${skippedCount} skipped)` : ''
        }`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Submission Failed', {
        description: errorMessage,
        duration: 5000,
      });
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
        size="lg"
      >
        {isSubmitting
          ? 'Submitting...'
          : images.length < 10
          ? `Upload ${10 - images.length} more images (${images.length}/10)`
          : `Submit ${images.length} Images to OpenAI`}
      </Button>
      {images.length < 10 && (
        <p className="text-amber-600 text-sm text-center">
          ⚠️ Minimum 10 images required for OpenAI fine-tuning
        </p>
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
