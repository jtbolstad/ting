import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';
import { AuthProvider } from '../context/AuthContext';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.login.title': 'Login to Ting',
        'auth.login.email': 'Email',
        'auth.login.password': 'Password',
        'auth.login.submit': 'Login',
        'auth.login.loggingIn': 'Logging in...',
        'auth.login.noAccount': "Don't have an account?",
        'auth.login.registerLink': 'Register here',
      };
      return translations[key] || key;
    },
  }),
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  it('should render login form', () => {
    renderLogin();

    expect(screen.getByText('Login to Ting')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show required validation', async () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    // HTML5 validation will prevent submission
    const emailInput = screen.getByRole('textbox', { name: /email/i }) as HTMLInputElement;
    expect(emailInput.validity.valid).toBe(false);
  });

  it('should accept email and password input', () => {
    renderLogin();

    const emailInput = screen.getByRole('textbox', { name: /email/i }) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should show loading state when submitting', async () => {
    renderLogin();

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should display register link', () => {
    renderLogin();

    const registerLink = screen.getByText('Register here');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
