import type { User } from './user.js';
import type { Item } from './item.js';
import type { Reservation } from './reservation.js';

export interface Loan {
  id: string;
  userId: string;
  user?: User;
  itemId: string;
  item?: Item;
  reservationId: string | null;
  reservation?: Reservation;
  checkedOutAt: string;
  dueDate: string;
  returnedAt: string | null;
  damageNote?: string | null;
}

export interface CheckoutInput {
  itemId: string;
  userId: string;
  reservationId?: string;
  dueDate: string;
}

export interface CheckinInput {
  loanId: string;
}

export interface LoanSearchParams {
  userId?: string;
  itemId?: string;
  active?: boolean;
  overdue?: boolean;
  page?: number;
  limit?: number;
}
