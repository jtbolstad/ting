import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ItemCard } from './ItemCard';
import { mockItem, mockCheckedOutItem } from '../../test/mocks/fixtures/items';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key.split('.').pop() ?? key,
  }),
}));

const renderCard = (item = mockItem) =>
  render(
    <BrowserRouter>
      <ItemCard item={item} />
    </BrowserRouter>
  );

describe('ItemCard', () => {
  it('viser tingets navn', () => {
    renderCard();
    expect(screen.getByText('18V Cordless Drill')).toBeInTheDocument();
  });

  it('lenker til slug-URL', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/items/18v-cordless-drill-q0r8cz'
    );
  });

  it('lenker til id-URL når slug mangler', () => {
    renderCard({ ...mockItem, slug: undefined });
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/items/${mockItem.id}`
    );
  });

  it('viser kategori', () => {
    renderCard();
    expect(screen.getByText('Power Tools')).toBeInTheDocument();
  });

  it('viser tags', () => {
    renderCard();
    expect(screen.getByText('drill')).toBeInTheDocument();
    expect(screen.getByText('cordless')).toBeInTheDocument();
  });

  it('viser AVAILABLE-status', () => {
    renderCard();
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('viser CHECKED_OUT-status', () => {
    renderCard(mockCheckedOutItem);
    expect(screen.getByText('checkedOut')).toBeInTheDocument();
  });
});
