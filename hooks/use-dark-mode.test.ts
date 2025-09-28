import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from './use-dark-mode';

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
  value: jest.fn().mockImplementation((query) => ({
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

describe('useDarkMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockDocumentElement.classList.contains.mockReturnValue(false);
  });

  it('should initialize with light mode by default', () => {
    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(false);
    expect(result.current.toggleDarkMode).toBeInstanceOf(Function);
  });

  it('should initialize with dark mode if localStorage has dark theme', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    mockDocumentElement.classList.contains.mockReturnValue(true);

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(true);
  });

  it('should toggle dark mode when toggleDarkMode is called', () => {
    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(false);

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should toggle back to light mode when toggleDarkMode is called again', () => {
    const { result } = renderHook(() => useDarkMode());

    // First toggle to dark mode
    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.isDarkMode).toBe(true);

    // Second toggle back to light mode
    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.isDarkMode).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('should apply dark mode to document element on mount if dark theme is stored', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    renderHook(() => useDarkMode());

    expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should respect system preference when no theme is stored', () => {
    localStorageMock.getItem.mockReturnValue(null);
    // Mock matchMedia to return true for dark preference
    const mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(true);
    expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should not apply dark mode when system prefers light and no theme is stored', () => {
    localStorageMock.getItem.mockReturnValue(null);
    // Mock matchMedia to return false for dark preference
    const mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(false);
    expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('should prioritize saved theme over system preference', () => {
    localStorageMock.getItem.mockReturnValue('light');
    // Mock matchMedia to return true for dark preference (system prefers dark)
    const mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useDarkMode());

    // Should be light mode despite system preferring dark
    expect(result.current.isDarkMode).toBe(false);
    expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
  });
});
