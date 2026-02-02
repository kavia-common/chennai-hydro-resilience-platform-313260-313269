import { render, screen } from '@testing-library/react';
import App from './App';

// Mock AuthContext
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

test('renders login page when not authenticated', () => {
  render(<App />);
  // Check for login-related elements
  const loginElements = screen.queryAllByText(/sign in|login|welcome/i);
  expect(loginElements.length).toBeGreaterThan(0);
});
