import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MembershipNotice } from './MembershipNotice';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'auth.membershipNotice.text': 'To borrow from ting.hpvel.no you need an active membership.',
        'auth.membershipNotice.cta': 'You can sign up at',
        'auth.membershipNotice.linkLabel': 'hpvel.no/bli-medlem',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('MembershipNotice', () => {
  it('viser medlemskapsvarsel med lenke til innmelding', () => {
    render(<MembershipNotice />);

    expect(
      screen.getByText(/To borrow from ting\.hpvel\.no you need an active membership\./)
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'hpvel.no/bli-medlem' });
    expect(link).toHaveAttribute('href', 'https://hpvel.no/bli-medlem/');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
