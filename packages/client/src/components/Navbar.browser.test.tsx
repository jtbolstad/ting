import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

const mockLogout = vi.fn();
let mockAuthState: Record<string, unknown> = {
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  logout: mockLogout,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../context/OrganizationContext', () => ({
  useOrganization: () => ({
    activeOrganizationId: null,
    organizations: [],
    setActiveOrganizationId: vi.fn(),
    activeOrganization: undefined,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) => {
      const map: Record<string, string> = {
        'app.title': 'Ting',
        'nav.catalog': 'Catalog',
        'nav.dashboard': 'My Dashboard',
        'nav.admin': 'Admin',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'nav.logout': 'Logout',
        'nav.addItem': 'Add Item',
      };
      if (key === 'nav.hello') return `Hello, ${opts?.name ?? ''}`;
      return map[key] ?? key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const renderNavbar = () =>
  render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );

describe('Navbar', () => {
  beforeEach(() => {
    mockAuthState = {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      logout: mockLogout,
    };
  });

  it('viser app-tittel', () => {
    renderNavbar();
    expect(screen.getByText('Ting')).toBeInTheDocument();
  });

  it('viser login og register for ikke-innloggede brukere', () => {
    renderNavbar();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('viser navigasjonslenker for innloggede brukere', () => {
    mockAuthState = {
      isAuthenticated: true,
      isAdmin: false,
      isOrgManager: false,
      user: { id: '1', email: 'lars@ting.com', name: 'Lars Nilsen', role: 'MEMBER' },
      logout: mockLogout,
      memberships: [],
      activeMembership: null,
    };
    renderNavbar();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('viser admin-lenke for admin-brukere', () => {
    mockAuthState = {
      isAuthenticated: true,
      isAdmin: true,
      isOrgManager: true,
      user: { id: '1', email: 'admin@ting.com', name: 'Admin', role: 'ADMIN' },
      logout: mockLogout,
      memberships: [],
      activeMembership: null,
    };
    renderNavbar();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
