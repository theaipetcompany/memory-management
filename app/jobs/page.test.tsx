import { render, screen } from '@testing-library/react';
import JobsPage from './page';

// Mock the FineTuningJobsList component
jest.mock('@/components/fine-tuning-jobs-list', () => ({
  FineTuningJobsList: () => (
    <div data-testid="fine-tuning-jobs-list">Fine-tuning Jobs List</div>
  ),
}));

describe('JobsPage', () => {
  it('renders the page title and description', () => {
    render(<JobsPage />);

    expect(screen.getByText('Fine-tuning Jobs')).toBeInTheDocument();
    expect(
      screen.getByText('Monitor your fine-tuning job progress')
    ).toBeInTheDocument();
  });

  it('renders the FineTuningJobsList component', () => {
    render(<JobsPage />);

    expect(screen.getByTestId('fine-tuning-jobs-list')).toBeInTheDocument();
  });
});
