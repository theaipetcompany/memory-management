import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddImageModal } from './add-image-modal';

const mockAddImages = jest.fn();

describe('AddImageModal', () => {
  beforeEach(() => {
    mockAddImages.mockClear();
  });

  test('should open modal', async () => {
    const user = userEvent.setup();
    render(<AddImageModal onAddImages={mockAddImages} />);

    const addButton = screen.getByText('Add Images');
    await user.click(addButton);

    expect(screen.getByText('Add New Images')).toBeInTheDocument();
  });

  test('should submit multiple images', async () => {
    const user = userEvent.setup();
    render(<AddImageModal onAddImages={mockAddImages} />);

    // Open modal
    const addButton = screen.getByText('Add Images');
    await user.click(addButton);

    // Fill form
    const fileInput = screen.getByLabelText('Image Files');
    const annotationInput = screen.getByLabelText('Annotation');

    const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, [file1, file2]);
    await user.type(annotationInput, 'Test images');

    // Check that files are displayed
    expect(
      screen.getByText('Selected 2 files: test1.jpg, test2.jpg')
    ).toBeInTheDocument();

    const submitButton = screen.getByText('Add 2 Images');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddImages).toHaveBeenCalledWith({
        files: [file1, file2],
        annotation: 'Test images',
      });
    });
  });

  test('should close modal after successful submission', async () => {
    const user = userEvent.setup();
    render(<AddImageModal onAddImages={mockAddImages} />);

    // Open modal
    const addButton = screen.getByText('Add Images');
    await user.click(addButton);

    // Fill and submit form
    const fileInput = screen.getByLabelText('Image Files');
    const annotationInput = screen.getByLabelText('Annotation');

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);
    await user.type(annotationInput, 'A test image');

    const submitButton = screen.getByText('Add 1 Image');
    await user.click(submitButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Add New Images')).not.toBeInTheDocument();
    });
  });
});
