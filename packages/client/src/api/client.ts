import type { ApiResponse, AuthResponse, User, Item, Category, Reservation, Loan, PaginatedResponse } from '@ting/shared';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(),
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data!;
  }

  // Auth
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  // Items
  async getItems(params?: {
    q?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Item>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<PaginatedResponse<Item>>(`/items${query ? `?${query}` : ''}`);
  }

  async getItem(id: string): Promise<Item> {
    return this.request<Item>(`/items/${id}`);
  }

  async createItem(data: { name: string; description?: string; categoryId: string; imageUrl?: string }): Promise<Item> {
    return this.request<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    return this.request<Item>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: string): Promise<void> {
    return this.request<void>(`/items/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  async createCategory(data: { name: string; description?: string; parentId?: string }): Promise<Category> {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reservations
  async getReservations(userId?: string): Promise<Reservation[]> {
    const query = userId ? `?userId=${userId}` : '';
    return this.request<Reservation[]>(`/reservations${query}`);
  }

  async checkAvailability(itemId: string, startDate: string, endDate: string): Promise<{ available: boolean }> {
    const query = new URLSearchParams({ startDate, endDate }).toString();
    return this.request<{ available: boolean }>(`/reservations/availability/${itemId}?${query}`);
  }

  async createReservation(data: { itemId: string; startDate: string; endDate: string }): Promise<Reservation> {
    return this.request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelReservation(id: string): Promise<void> {
    return this.request<void>(`/reservations/${id}`, { method: 'DELETE' });
  }

  // Loans
  async getLoans(params?: { active?: boolean; overdue?: boolean; userId?: string }): Promise<Loan[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<Loan[]>(`/loans${query ? `?${query}` : ''}`);
  }

  async checkout(data: { itemId: string; userId?: string; reservationId?: string; dueDate: string }): Promise<Loan> {
    return this.request<Loan>('/loans/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkin(loanId: string): Promise<Loan> {
    return this.request<Loan>(`/loans/${loanId}/checkin`, {
      method: 'POST',
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
