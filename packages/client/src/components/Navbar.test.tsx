import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

// Mock the entire auth context module
const mockLogout = vi.fn();
let mockAuthState = {
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  logout: mockLogout,
  login: vi.fn(),
  register: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'app.title': 'Ting',
        'nav.catalog': 'Catalog',
        'nav.dashboard': 'My Dashboard',
        'nav.admin': 'Admin',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'nav.logout': 'Logout',
        'nav.hello': `Hello, ${options?.name || ''}`,
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    // Reset to default unauthenticated state
    mockAuthState = {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
    };
  });

  it('should render app title', () => {
    renderNavbar();
    expect(screen.getByText('Ting')).toBeInTheDocument();
  });

  it('should show login and register for unauthenticated users', () => {
    renderNavbar();
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should show navigation links for authenticated users', () => {
    mockAuthState = {
      isAuthenticated: true,
      isAdmin: false,
      user: { id: '1', email: 'user@test.com', name: 'Test User', role: 'MEMBER' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
    };

    renderNavbar();

    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should show admin link for admin users', () => {
    mockAuthState = {
      isAuthenticated: true,
      isAdmin: true,
      user: { id: '1', email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
    };

    renderNavbar();

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should display language switcher', () => {
    renderNavbar();
    
    // Language switcher should have flag emojis
    const navbar = screen.getByRole('navigation');
    expect(navbar.textContent).toContain('🇬🇧');
  });
});
