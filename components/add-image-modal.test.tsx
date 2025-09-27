import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddImageModal } from './add-image-modal';

const mockAddImage = jest.fn();

describe('AddImageModal', () => {
  beforeEach(() => {
    mockAddImage.mockClear();
  });

  test('should open modal', async () => {
    const user = userEvent.setup();
    render(<AddImageModal onAddImage={mockAddImage} />);

    const addButton = screen.getByText('Add Image');
    await user.click(addButton);

    expect(screen.getByText('Add New Image')).toBeInTheDocument();
  });

  test('should submit image', async () => {
    const user = userEvent.setup();
    render(<AddImageModal onAddImage={mockAddImage} />);

    // Open modal
    const addButton = screen.getByText('Add Image');
    await user.click(addButton);

    // Fill form
    const fileInput = screen.getByLabelText('Image File');
    const annotationInput = screen.getByLabelText('Annotation');
    const submitButton = screen.getByText('Add');

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);
    await user.type(annotationInput, 'A test image');

    // Submit
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddImage).toHaveBeenCalledWith({
        file: file,
        annotation: 'A test image',
      });
    });
  });

  test('should close modal after successful submission', async () => {
    const user = userEvent.setup();
    render(<AddImageModal onAddImage={mockAddImage} />);

    // Open modal
    const addButton = screen.getByText('Add Image');
    await user.click(addButton);

    // Fill and submit form
    const fileInput = screen.getByLabelText('Image File');
    const annotationInput = screen.getByLabelText('Annotation');
    const submitButton = screen.getByText('Add');

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);
    await user.type(annotationInput, 'A test image');
    await user.click(submitButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Add New Image')).not.toBeInTheDocument();
    });
  });
});
