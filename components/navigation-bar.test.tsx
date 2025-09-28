import { render, screen } from '@testing-library/react';
import { NavigationBar } from './navigation-bar';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

describe('NavigationBar', () => {
  it('renders navigation links', () => {
    render(<NavigationBar />);

    expect(screen.getByText('Memory Management')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
    expect(screen.getByText('Fine-tuning Jobs')).toBeInTheDocument();
  });

  it('highlights active page', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/jobs');

    render(<NavigationBar />);

    const jobsLink = screen.getByText('Fine-tuning Jobs');
    expect(jobsLink).toHaveClass('text-blue-600');
  });

  it('has correct href attributes', () => {
    render(<NavigationBar />);

    const learningLink = screen.getByText('Learning');
    const jobsLink = screen.getByText('Fine-tuning Jobs');

    expect(learningLink.closest('a')).toHaveAttribute('href', '/learning');
    expect(jobsLink.closest('a')).toHaveAttribute('href', '/jobs');
  });
});
