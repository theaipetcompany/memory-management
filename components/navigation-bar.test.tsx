import { render, screen } from '@testing-library/react';
import { NavigationBar } from './navigation-bar';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document.documentElement
const mockDocumentElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
  },
};
Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('NavigationBar', () => {
  it('renders navigation links', () => {
    render(<NavigationBar />);

    // Check for the logo/title
    expect(screen.getByRole('link', { name: 'Memory' })).toBeInTheDocument();
    // Check for navigation links
    expect(screen.getByRole('link', { name: 'Memory' })).toBeInTheDocument();
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
