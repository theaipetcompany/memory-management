'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Image {
  id: string;
  filename: string;
  annotation: string;
  createdAt: Date;
}

interface SubmitButtonProps {
  images: Image[];
}

export function SubmitButton({ images }: SubmitButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (images.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/submit', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      const job = await response.json();
      console.log('Job created:', job);
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
        disabled={images.length === 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit to OpenAI'}
      </Button>
      {error && (
        <p className="text-red-500 text-sm text-center">Error: {error}</p>
      )}
    </div>
  );
}
