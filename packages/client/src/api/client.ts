import type {
  ApiResponse,
  AuthResponse,
  User,
  Item,
  Category,
  Reservation,
  Loan,
  Comment,
  PaginatedResponse,
  Organization,
  Membership,
  MemberGroup,
  ImageUploadResponse,
} from '@ting/shared';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private activeOrganizationId: string | null;

  constructor() {
    this.activeOrganizationId = localStorage.getItem('activeOrganizationId');
  }

  setActiveOrganizationId(organizationId: string | null) {
    this.activeOrganizationId = organizationId;
    if (organizationId) {
      localStorage.setItem('activeOrganizationId', organizationId);
    } else {
      localStorage.removeItem('activeOrganizationId');
    }
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(this.activeOrganizationId && { 'X-Organization-Id': this.activeOrganizationId }),
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(),
    });

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      throw new Error('Server returned non-JSON response');
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data!;
  }

  // Auth
  async register(email: string, password: string, name: string, organizationId: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, organizationId }),
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
  async getItems(params: {
    organizationId: string;
    q?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Item>> {
    // Filter out undefined values and organizationId (sent via header instead)
    const queryParams: Record<string, string> = {};
    if (params.q) queryParams.q = params.q;
    if (params.categoryId) queryParams.categoryId = params.categoryId;
    if (params.status) queryParams.status = params.status;
    if (params.page) queryParams.page = params.page.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    
    const query = new URLSearchParams(queryParams).toString();
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
  async getCategories(organizationId: string): Promise<Category[]> {
    return this.request<Category[]>(`/categories?organizationId=${organizationId}`);
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
  async getUsers(): Promise<Array<{ membership: Membership; user: User }>> {
    return this.request<Array<{ membership: Membership; user: User }>>('/organizations/members');
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Organizations
  async getPublicOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/organizations/public');
  }

  async getMyMemberships(): Promise<Membership[]> {
    return this.request<Membership[]>('/organizations/me');
  }

  async createOrganization(data: { name: string; slug?: string; description?: string }): Promise<{ organization: Organization; membership: Membership }> {
    return this.request<{ organization: Organization; membership: Membership }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrganizationMembers(): Promise<Array<{ membership: Membership; user: User }>> {
    return this.request<Array<{ membership: Membership; user: User }>>('/organizations/members');
  }

  async addOrganizationMember(payload: { email: string; role?: string }): Promise<Membership> {
    return this.request<Membership>('/organizations/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateMembership(membershipId: string, payload: Partial<Membership>): Promise<Membership> {
    return this.request<Membership>(`/organizations/members/${membershipId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getGroups(): Promise<Array<MemberGroup & { memberCount: number }>> {
    return this.request<Array<MemberGroup & { memberCount: number }>>('/organizations/groups');
  }

  async createGroup(data: { name: string; description?: string }): Promise<MemberGroup> {
    return this.request<MemberGroup>('/organizations/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignGroupMember(groupId: string, membershipId: string): Promise<void> {
    return this.request<void>(`/organizations/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ membershipId }),
    });
  }

  // Uploads
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(this.activeOrganizationId && { 'X-Organization-Id': this.activeOrganizationId }),
    };
    // Note: Do NOT set Content-Type header - browser will set it with boundary

    const response = await fetch(`${API_BASE_URL}/uploads/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data;
  }

  // Comments
  async getItemComments(itemId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/comments/item/${itemId}`);
  }

  async createComment(data: { itemId: string; content: string }): Promise<Comment> {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(id: string): Promise<void> {
    return this.request<void>(`/comments/${id}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
