import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { worker } from '../test/mocks/worker';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: vi.fn() }),
}));

const translation = { t: (key: string, fallback?: string) => fallback ?? key, i18n: { language: 'en' } };
vi.mock('react-i18next', () => ({
  useTranslation: () => translation,
}));

const { Register } = await import('./Register');

const renderRegister = () =>
  render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );

describe('Register – Google-innlogging', () => {
  beforeEach(() => {
    worker.resetHandlers();
  });

  it('viser "Continue with Google"-knapp når Google-OAuth er aktivert', async () => {
    worker.use(
      http.get('*/api/auth/status', () => {
        return HttpResponse.json({ success: true, data: { google: true } });
      })
    );

    renderRegister();

    const link = await screen.findByRole('link', { name: 'auth.oauth.signInWithGoogle' });
    expect(link).toHaveAttribute('href', '/api/auth/google');
  });

  it('skjuler Google-knappen når Google-OAuth ikke er aktivert', async () => {
    worker.use(
      http.get('*/api/auth/status', () => {
        return HttpResponse.json({ success: true, data: { google: false } });
      })
    );

    renderRegister();

    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'auth.oauth.signInWithGoogle' })
      ).not.toBeInTheDocument()
    );
  });
});
