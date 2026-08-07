import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const getInvitations = vi.fn();

vi.mock('../../api/client', () => ({
  apiClient: {
    getLoans: vi.fn(async () => []),
    getItems: vi.fn(async () => ({ items: [], total: 0 })),
    getCategories: vi.fn(async () => []),
    getUsers: vi.fn(async () => []),
    getLocations: vi.fn(async () => []),
    getReservations: vi.fn(async () => []),
    getGroups: vi.fn(async () => []),
    getInvitations: (...args: unknown[]) => getInvitations(...args),
  },
}));

// Stable identity: AdminDashboard has an effect keyed on `activeOrganization`,
// so a fresh object per render would re-trigger it forever.
const organizationContext = {
  activeOrganizationId: 'org-1',
  activeOrganization: {
    id: 'org-1',
    name: 'Testlaget',
    description: '',
    loanDurationDays: 7,
  },
  organizations: [],
  setActiveOrganizationId: vi.fn(),
};

vi.mock('../../context/OrganizationContext', () => ({
  useOrganization: () => organizationContext,
}));

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('../../components/ui/Toast', () => ({
  useToast: () => toast,
}));

const confirm = vi.fn(async () => true);
vi.mock('../../components/ui/ConfirmModal', () => ({
  useConfirm: () => confirm,
}));

const i18n = { language: 'no', changeLanguage: vi.fn() };
const translation = { t: (key: string) => key, i18n };
vi.mock('react-i18next', () => ({
  useTranslation: () => translation,
}));

const { AdminDashboard } = await import('./AdminDashboard');

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <AdminDashboard />
    </BrowserRouter>
  );

describe('AdminDashboard – ventende invitasjoner', () => {
  beforeEach(() => {
    getInvitations.mockReset();
    getInvitations.mockResolvedValue([
      {
        id: 'inv-1',
        email: 'kari@example.com',
        role: 'MEMBER',
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        usedAt: null,
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  it('laster invitasjonene ved oppstart, uten at man må åpne invitasjonsmodalen', async () => {
    renderDashboard();

    const usersTab = await screen.findByRole('button', { name: 'admin.tabs.users' });
    usersTab.click();

    expect(await screen.findByText('kari@example.com')).toBeInTheDocument();
    expect(getInvitations).toHaveBeenCalled();
  });
});
