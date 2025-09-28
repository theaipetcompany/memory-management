import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FaceUpload } from './face-upload';

// Mock file reading
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,mock-image-data',
  onload: null as any,
  onerror: null as any,
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
global.FileReader = jest.fn(() => mockFileReader) as any;

describe('Face Upload Component', () => {
  const mockOnImageUpload = jest.fn();
  const mockOnFaceDetected = jest.fn();
  const mockOnFaceLinked = jest.fn();

  beforeEach(() => {
    mockOnImageUpload.mockClear().mockResolvedValue(undefined);
    mockOnFaceDetected.mockClear().mockResolvedValue(undefined);
    mockOnFaceLinked.mockClear().mockResolvedValue(undefined);
    (global.URL.createObjectURL as jest.Mock).mockClear();
    (global.URL.revokeObjectURL as jest.Mock).mockClear();
  });

  describe('file upload', () => {
    it('should accept image files and show preview', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          showSubmitButton={true}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      // Should show preview and submit button, but not automatically upload
      await waitFor(() => {
        expect(screen.getByText('Add to Memory')).toBeInTheDocument();
      });

      // onImageUpload should not be called automatically
      expect(mockOnImageUpload).not.toHaveBeenCalled();
    });

    it('should validate image dimensions', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const invalidFile = new File(['invalid'], 'test.txt', {
        type: 'text/plain',
      });

      // Use fireEvent.change instead of user.upload for this test
      fireEvent.change(fileInput, {
        target: { files: [invalidFile] },
      });

      await waitFor(() => {
        expect(
          screen.getByText('Please upload a valid image file')
        ).toBeInTheDocument();
      });
    });

    it('should show upload progress', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          loading={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Processing image...'
      );
    });

    it('should handle drag and drop', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          showSubmitButton={true}
        />
      );

      const dropZone = screen
        .getByText('Drag and drop an image here')
        .closest('div');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Use fireEvent for drag and drop since user.upload doesn't work with div elements
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [imageFile],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Add to Memory')).toBeInTheDocument();
      });

      // Should not automatically upload
      expect(mockOnImageUpload).not.toHaveBeenCalled();
    });

    it('should show file size validation error', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      // Create a large file (simulate > 10MB)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      const fileInput = screen.getByLabelText('Upload image');
      await user.upload(fileInput, largeFile);

      expect(
        screen.getByText('File size must be less than 10MB')
      ).toBeInTheDocument();
    });

    it('should show supported formats message', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      expect(
        screen.getByText('Supported formats: JPEG, PNG, WEBP')
      ).toBeInTheDocument();
    });
  });

  describe('name field', () => {
    it('should render name input field when showNameField is true', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          showNameField={true}
        />
      );

      expect(screen.getByLabelText('Person Name *')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter the person's name...")
      ).toBeInTheDocument();
    });

    it('should not render name input field when showNameField is false', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          showNameField={false}
        />
      );

      expect(screen.queryByLabelText('Person Name *')).not.toBeInTheDocument();
    });

    it('should show submit button when showSubmitButton is true', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          showNameField={true}
          showSubmitButton={true}
        />
      );

      const nameInput = screen.getByLabelText('Person Name *');
      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.type(nameInput, 'John Doe');
      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Add to Memory')).toBeInTheDocument();
      });
    });

    it('should not show submit button when showSubmitButton is false', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          showNameField={true}
          showSubmitButton={false}
        />
      );

      expect(screen.queryByText('Add to Memory')).not.toBeInTheDocument();
    });

    it('should validate that name is required before submission', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          showNameField={true}
          showSubmitButton={true}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Add to Memory')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Add to Memory');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a person name')
        ).toBeInTheDocument();
      });

      // Should not call onImageUpload without a name
      expect(mockOnImageUpload).not.toHaveBeenCalled();
    });

    it('should call onImageUpload when submit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          showNameField={true}
          showSubmitButton={true}
        />
      );

      const nameInput = screen.getByLabelText('Person Name *');
      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.type(nameInput, 'John Doe');
      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Add to Memory')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Add to Memory');
      await user.click(submitButton);

      expect(mockOnImageUpload).toHaveBeenCalledWith(imageFile, 'John Doe');
    });

    it('should pass name to onImageUpload when provided', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          showNameField={true}
          showSubmitButton={true}
        />
      );

      const nameInput = screen.getByLabelText('Person Name *');
      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.type(nameInput, 'John Doe');
      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Add to Memory')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Add to Memory');
      await user.click(submitButton);

      expect(mockOnImageUpload).toHaveBeenCalledWith(imageFile, 'John Doe');
    });

    it('should call onFaceLinked when name is provided and faces are detected', async () => {
      const user = userEvent.setup();
      const mockFaces = [
        { x: 100, y: 100, width: 200, height: 200, confidence: 0.95 },
      ];
      const mockDetectFaces = jest.fn().mockResolvedValue(mockFaces);

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          onFaceLinked={mockOnFaceLinked}
          detectFaces={mockDetectFaces}
          showNameField={true}
        />
      );

      const nameInput = screen.getByLabelText('Person Name *');
      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.type(nameInput, 'John Doe');
      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(mockOnFaceLinked).toHaveBeenCalledWith('John Doe', mockFaces);
      });
    });
  });

  describe('face detection', () => {
    it('should detect faces in uploaded images', async () => {
      const user = userEvent.setup();
      const mockFaces = [
        { x: 100, y: 100, width: 200, height: 200, confidence: 0.95 },
      ];
      const mockDetectFaces = jest.fn().mockResolvedValue(mockFaces);

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          detectFaces={mockDetectFaces}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(mockOnFaceDetected).toHaveBeenCalled();
      });
    });

    it('should handle images without faces', async () => {
      const user = userEvent.setup();
      const mockDetectFaces = jest.fn().mockResolvedValue([]);

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          detectFaces={mockDetectFaces}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(
          screen.getByText('No faces detected in image.')
        ).toBeInTheDocument();
      });
    });

    it('should handle multiple faces', async () => {
      const user = userEvent.setup();
      const mockFaces = [
        { x: 100, y: 100, width: 200, height: 200, confidence: 0.95 },
        { x: 300, y: 100, width: 200, height: 200, confidence: 0.9 },
      ];
      const mockDetectFaces = jest.fn().mockResolvedValue(mockFaces);

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          detectFaces={mockDetectFaces}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('2 faces detected.')).toBeInTheDocument();
      });
    });

    it('should show face detection overlay', async () => {
      const user = userEvent.setup();
      const mockFaces = [
        { x: 100, y: 100, width: 200, height: 200, confidence: 0.95 },
      ];
      const mockDetectFaces = jest.fn().mockResolvedValue(mockFaces);

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          detectFaces={mockDetectFaces}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Face detected')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message when provided', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          error="Upload failed"
        />
      );

      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('should handle upload errors gracefully', async () => {
      const user = userEvent.setup();
      mockOnImageUpload.mockRejectedValue(new Error('Upload failed'));

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          showSubmitButton={true}
        />
      );

      const nameInput = screen.getByLabelText('Person Name *');
      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.type(nameInput, 'John Doe');
      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(screen.getByText('Add to Memory')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Add to Memory');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
    });

    it('should handle face detection errors', async () => {
      const user = userEvent.setup();
      const mockDetectFaces = jest
        .fn()
        .mockRejectedValue(new Error('Face detection failed.'));

      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          detectFaces={mockDetectFaces}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Use fireEvent.change instead of user.upload
      fireEvent.change(fileInput, {
        target: { files: [imageFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('Face detection failed.')).toBeInTheDocument();
      });
    });
  });

  describe('image preview', () => {
    it('should show image preview after upload', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(
          screen.getByAltText('Uploaded image preview')
        ).toBeInTheDocument();
      });
    });

    it('should allow removing uploaded image', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, imageFile);

      await waitFor(() => {
        const removeButton = screen.getByText('Remove image');
        expect(removeButton).toBeInTheDocument();
      });

      const removeButton = screen.getByText('Remove image');
      await user.click(removeButton);

      expect(
        screen.queryByAltText('Uploaded image preview')
      ).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Upload image' })
      ).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
        />
      );

      const uploadButton = screen.getByRole('button', { name: 'Upload image' });
      uploadButton.focus();

      expect(uploadButton).toHaveFocus();

      await user.keyboard('{Enter}');
      // Should trigger file input
      expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
    });

    it('should announce upload status to screen readers', async () => {
      const user = userEvent.setup();
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          loading={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Processing image...'
      );
    });
  });

  describe('loading states', () => {
    it('should disable upload when loading', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          loading={true}
        />
      );

      const fileInput = screen.getByLabelText('Upload image');
      expect(fileInput).toBeDisabled();
    });

    it('should show loading spinner', () => {
      render(
        <FaceUpload
          onImageUpload={mockOnImageUpload}
          onFaceDetected={mockOnFaceDetected}
          loading={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
