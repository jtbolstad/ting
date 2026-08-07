import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { mockItem, mockCheckedOutItem } from '../test/mocks/fixtures/items';
import type { Item } from '@ting/shared';

const getItems = vi.fn();

vi.mock('../api/client', () => ({
  apiClient: {
    getItems: (...args: unknown[]) => getItems(...args),
  },
}));

// Stable identity: a fresh object per render would retrigger effects forever.
const organizationContext = {
  activeOrganizationId: 'org-1',
  activeOrganization: undefined,
  organizations: [],
  isLoading: false,
  setActiveOrganizationId: vi.fn(),
  refresh: vi.fn(),
};
vi.mock('../context/OrganizationContext', () => ({
  useOrganization: () => organizationContext,
}));

const auth = { isAuthenticated: false };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => auth,
}));

const translation = { t: (key: string, fallback?: string) => fallback ?? key };
vi.mock('react-i18next', () => ({
  useTranslation: () => translation,
}));

const { Home } = await import('./Home');

const makeItems = (n: number): Item[] =>
  Array.from({ length: n }, (_, i) => ({
    ...mockItem,
    id: `item-${i}`,
    slug: `ting-${i}`,
    name: `Ting ${i}`,
  }));

const renderHome = () =>
  render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );

describe('Home – tilfeldige ting fra katalogen', () => {
  beforeEach(() => {
    getItems.mockReset();
    getItems.mockResolvedValue({ items: makeItems(8), total: 8 });
  });

  it('viser tre ting fra katalogen', async () => {
    renderHome();

    await waitFor(() => expect(getItems).toHaveBeenCalled());
    const cards = await screen.findAllByRole('link', { name: /Ting \d/ });
    expect(cards).toHaveLength(3);
  });

  it('henter tingene for den aktive organisasjonen', async () => {
    renderHome();

    await waitFor(() =>
      expect(getItems).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1', status: 'AVAILABLE' })
      )
    );
  });

  it('viser alt som finnes når katalogen har færre enn tre ting', async () => {
    getItems.mockResolvedValue({ items: [mockItem, mockCheckedOutItem], total: 2 });
    renderHome();

    expect(await screen.findByText('18V Cordless Drill')).toBeInTheDocument();
    expect(screen.getByText('Impact Driver')).toBeInTheDocument();
  });

  it('skjuler seksjonen når katalogen er tom', async () => {
    getItems.mockResolvedValue({ items: [], total: 0 });
    renderHome();

    await waitFor(() => expect(getItems).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText('home.available.title')).not.toBeInTheDocument()
    );
  });

  it('skjuler seksjonen når kallet feiler', async () => {
    getItems.mockRejectedValue(new Error('nettverksfeil'));
    renderHome();

    await waitFor(() => expect(getItems).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText('home.available.title')).not.toBeInTheDocument()
    );
  });

  it('viser fortsatt heltebanneret', async () => {
    renderHome();
    expect(screen.getByText('home.hero.title')).toBeInTheDocument();
  });
});
