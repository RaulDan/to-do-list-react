import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the to-do application', () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(() => new Promise(() => {}));
  render(<App />);
  expect(screen.getByRole('heading', { name: 'To-Do List', exact: true })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add to-do' })).toBeInTheDocument();
  global.fetch = originalFetch;
});
