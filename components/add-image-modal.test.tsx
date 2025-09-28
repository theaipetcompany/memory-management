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

  test('should submit multiple images without annotation', async () => {
    const user = userEvent.setup();
    render(<AddImageModal onAddImages={mockAddImages} />);

    // Open modal
    const addButton = screen.getByText('Add Images');
    await user.click(addButton);

    // Fill form
    const fileInput = screen.getByLabelText('Image Files');

    const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, [file1, file2]);

    // Check that files are displayed
    expect(
      screen.getByText('Selected 2 files: test1.jpg, test2.jpg')
    ).toBeInTheDocument();

    const submitButton = screen.getByText('Add 2 Images');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddImages).toHaveBeenCalledWith([file1, file2]);
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

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    const submitButton = screen.getByText('Add 1 Image');
    await user.click(submitButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Add New Images')).not.toBeInTheDocument();
    });
  });
});
