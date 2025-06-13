import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from '../components/auth/Login';
import SignUp from '../components/auth/SignUp';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// Test component to access auth context
const TestAuthConsumer = () => {
  const { user, signOut } = useAuth();
  return (
    <div>
      {user ? (
        <>
          <div data-testid="user-email">{user.email}</div>
          <button onClick={() => signOut()} data-testid="signout-button">
            Sign Out
          </button>
        </>
      ) : (
        <div data-testid="no-user">No user logged in</div>
      )}
    </div>
  );
};

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('provides authentication context', async () => {
      // Mock a logged-in user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // Initially should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    it('handles sign out', async () => {
      // Mock a logged-in user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock sign out success
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toBeInTheDocument();
      });

      // Click sign out button
      fireEvent.click(screen.getByTestId('signout-button'));

      // Mock the auth state change after sign out
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Wait for the effect to update
      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Login Component', () => {
    it('renders login form', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('submits login form with credentials', async () => {
      // Mock successful login
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </MemoryRouter>
      );

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/email address/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('handles login error', async () => {
      // Mock login failure
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </MemoryRouter>
      );

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/email address/i), {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    it('handles password reset request', async () => {
      // Mock password reset success
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </MemoryRouter>
      );

      // Fill in email
      fireEvent.change(screen.getByPlaceholderText(/email address/i), {
        target: { value: 'test@example.com' },
      });

      // Click forgot password button
      fireEvent.click(screen.getByText(/forgot your password/i));

      await waitFor(() => {
        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          expect.any(Object)
        );
      });
    });
  });

  describe('SignUp Component', () => {
    it('renders signup form', () => {
      render(
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>
      );

      expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('submits signup form with user details', async () => {
      // Mock successful signup
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'new@example.com',
          },
        },
        error: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <SignUp />
          </AuthProvider>
        </MemoryRouter>
      );

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/full name/i), {
        target: { value: 'New User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/email address/i), {
        target: { value: 'new@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'New User',
            },
          },
        });
      });
    });
  });

  describe('ProtectedRoute', () => {
    it('renders children when user is authenticated', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('redirects to login when user is not authenticated', async () => {
      // Mock unauthenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      );

      // Should not render protected content
      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });
});