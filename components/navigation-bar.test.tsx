import { render, screen } from '@testing-library/react';
import { NavigationBar } from './navigation-bar';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

describe('NavigationBar', () => {
  it('renders navigation links', () => {
    render(<NavigationBar />);

    expect(screen.getByText('OpenAI Vision Fine-tuning')).toBeInTheDocument();
    expect(screen.getByText('Upload Images')).toBeInTheDocument();
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

    const uploadLink = screen.getByText('Upload Images');
    const jobsLink = screen.getByText('Fine-tuning Jobs');

    expect(uploadLink.closest('a')).toHaveAttribute('href', '/');
    expect(jobsLink.closest('a')).toHaveAttribute('href', '/jobs');
  });
});
