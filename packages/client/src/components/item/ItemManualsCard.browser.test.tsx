import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const getItemManuals = vi.fn();

vi.mock('../../api/client', () => ({
  apiClient: {
    getItemManuals: (...args: unknown[]) => getItemManuals(...args),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ isAdmin: true }),
}));

vi.mock('../ui/Toast', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn() }),
}));

vi.mock('../ui/ConfirmModal', () => ({
  useConfirm: () => vi.fn(async () => true),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'item.manuals.title': 'Bruksanvisninger',
        'item.manuals.noManuals': 'Ingen bruksanvisninger lagt til.',
        'item.manuals.addManual': 'Legg til bruksanvisning',
      };
      return map[key] ?? key;
    },
  }),
}));

const { ItemManualsCard } = await import('./ItemManualsCard');

describe('ItemManualsCard', () => {
  beforeEach(() => {
    getItemManuals.mockReset();
    getItemManuals.mockResolvedValue([]);
  });

  it('viser legg-til-knappen under tomtilstandsteksten', async () => {
    render(<ItemManualsCard itemId="item-1" />);

    const emptyStateText = await screen.findByText('Ingen bruksanvisninger lagt til.');
    const addButton = screen.getByRole('button', { name: 'Legg til bruksanvisning' });

    expect(getItemManuals).toHaveBeenCalledWith('item-1');
    expect(
      emptyStateText.compareDocumentPosition(addButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
