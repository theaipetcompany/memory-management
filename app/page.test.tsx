import { render, screen } from '@testing-library/react';
import Home from '../app/page';

describe('Home Page', () => {
  test('should render welcome message', () => {
    render(<Home />);

    expect(
      screen.getByText('Welcome to Memory Management')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your AI fine-tuning platform for creating custom models with annotated images/
      )
    ).toBeInTheDocument();
  });

  test('should have correct heading structure', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome to Memory Management');
  });

  test('should render description paragraph', () => {
    render(<Home />);

    const description = screen.getByText(
      /Get started by uploading your training data and managing your fine-tuning jobs/
    );
    expect(description).toBeInTheDocument();
  });
});
