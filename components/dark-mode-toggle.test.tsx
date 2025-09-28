import { render, screen, fireEvent } from '@testing-library/react';
import { DarkModeToggle } from './dark-mode-toggle';

// Mock the useDarkMode hook
jest.mock('../hooks/use-dark-mode', () => ({
  useDarkMode: jest.fn(),
}));

const mockUseDarkMode = require('../hooks/use-dark-mode').useDarkMode;

describe('DarkModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders toggle button', () => {
    mockUseDarkMode.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: jest.fn(),
    });

    render(<DarkModeToggle />);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows sun icon when in light mode', () => {
    mockUseDarkMode.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: jest.fn(),
    });

    render(<DarkModeToggle />);

    const sunIcon = screen.getByTestId('sun-icon');
    expect(sunIcon).toBeInTheDocument();
  });

  it('shows moon icon when in dark mode', () => {
    mockUseDarkMode.mockReturnValue({
      isDarkMode: true,
      toggleDarkMode: jest.fn(),
    });

    render(<DarkModeToggle />);

    const moonIcon = screen.getByTestId('moon-icon');
    expect(moonIcon).toBeInTheDocument();
  });

  it('calls toggleDarkMode when button is clicked', () => {
    const mockToggleDarkMode = jest.fn();
    mockUseDarkMode.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: mockToggleDarkMode,
    });

    render(<DarkModeToggle />);

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    mockUseDarkMode.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: jest.fn(),
    });

    render(<DarkModeToggle />);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle dark mode');
  });

  it('applies correct styling classes', () => {
    mockUseDarkMode.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: jest.fn(),
    });

    render(<DarkModeToggle />);

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveClass(
      'p-2',
      'rounded-md',
      'hover:bg-gray-100',
      'dark:hover:bg-gray-800'
    );
  });
});
