import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { OrganizationProvider } from '../context/OrganizationContext';
import { ToastProvider } from '../components/ui/Toast';

export function renderWithProviders(ui: ReactElement) {
  return render(
    <BrowserRouter>
      <OrganizationProvider>
        <AuthProvider>
          <ToastProvider>
            {ui}
          </ToastProvider>
        </AuthProvider>
      </OrganizationProvider>
    </BrowserRouter>
  );
}
