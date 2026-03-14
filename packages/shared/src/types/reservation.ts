import type { User } from './user.js';
import type { Item } from './item.js';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  userId: string;
  user?: User;
  itemId: string;
  item?: Item;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface CreateReservationInput {
  itemId: string;
  startDate: string;
  endDate: string;
}

export interface UpdateReservationInput {
  startDate?: string;
  endDate?: string;
  status?: ReservationStatus;
}

export interface AvailabilityQuery {
  itemId: string;
  startDate: string;
  endDate: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts?: Reservation[];
}
