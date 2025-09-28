'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface FaceUploadProps {
  onImageUpload: (file: File) => Promise<void>;
  onFaceDetected?: (faces: DetectedFace[]) => Promise<void>;
  loading?: boolean;
  error?: string;
  detectFaces?: (file: File) => Promise<DetectedFace[]>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function FaceUpload({
  onImageUpload,
  onFaceDetected,
  loading = false,
  error,
  detectFaces,
}: FaceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [faceDetectionResult, setFaceDetectionResult] = useState<
    DetectedFace[] | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return 'Please upload a valid image file';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setUploadError(null);
      setSelectedFile(file);
      setFaceDetectionResult(null);
      setIsProcessing(true);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      try {
        await onImageUpload(file);

        // Face detection
        if (detectFaces) {
          const faces = await detectFaces(file);
          setFaceDetectionResult(faces);
          if (onFaceDetected) {
            await onFaceDetected(faces);
          }
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [onImageUpload, onFaceDetected, detectFaces]
  );

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayError = error || uploadError;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Face Image</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Supported formats: JPEG, PNG, WEBP
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25'
          }
          ${
            loading
              ? 'opacity-50 pointer-events-none'
              : 'hover:border-primary/50'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Uploaded image preview"
                className="max-w-full max-h-64 rounded-lg"
              />
              {/* Face detection overlay */}
              {faceDetectionResult && faceDetectionResult.length > 0 && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  {faceDetectionResult.length === 1
                    ? 'Face detected'
                    : `${faceDetectionResult.length} faces detected`}
                </div>
              )}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                disabled={loading}
              >
                Remove image
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl text-muted-foreground">📷</div>
            <div>
              <p className="text-lg font-medium">Drag and drop an image here</p>
              <p className="text-sm text-muted-foreground">or</p>
            </div>
            <Button
              onClick={handleButtonClick}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing image...' : 'Upload image'}
            </Button>
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Upload image"
          disabled={loading}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Processing image...</p>
        </div>
      )}

      {/* Error Display */}
      {displayError && (
        <div className="text-center">
          <p className="text-sm text-destructive">{displayError}</p>
        </div>
      )}

      {/* Face Detection Results */}
      {selectedFile && !loading && !displayError && faceDetectionResult && (
        <div className="text-center">
          {faceDetectionResult.length === 0 ? (
            <p className="text-sm text-yellow-600">
              No faces detected in image.
            </p>
          ) : (
            <p className="text-sm text-green-600">
              {faceDetectionResult.length === 1
                ? '1 face detected'
                : `${faceDetectionResult.length} faces detected.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
