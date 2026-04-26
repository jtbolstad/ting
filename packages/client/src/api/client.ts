import type {
  ApiResponse,
  AuthResponse,
  Category,
  Comment,
  ImageUploadResponse,
  Item,
  ItemManual,
  Loan,
  Location,
  MemberGroup,
  Membership,
  Organization,
  PaginatedResponse,
  Reservation,
  Review,
  ReviewStats,
  User,
} from "@ting/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  private activeOrganizationId: string | null;

  constructor() {
    this.activeOrganizationId = localStorage.getItem("activeOrganizationId");
  }

  setActiveOrganizationId(organizationId: string | null) {
    this.activeOrganizationId = organizationId;
    if (organizationId) {
      localStorage.setItem("activeOrganizationId", organizationId);
    } else {
      localStorage.removeItem("activeOrganizationId");
    }
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(this.activeOrganizationId && {
        "X-Organization-Id": this.activeOrganizationId,
      }),
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(),
    });

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      throw new Error("Server returned non-JSON response");
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Request failed");
    }

    return data.data!;
  }

  // Auth
  async register(
    email: string,
    password: string,
    name: string,
    organizationId: string,
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, organizationId }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getCurrentUser(): Promise<{
    user: User;
    memberships: Membership[];
    activeMembershipId: string | null;
  }> {
    return this.request<{
      user: User;
      memberships: Membership[];
      activeMembershipId: string | null;
    }>("/auth/me");
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
    return this.request<PaginatedResponse<Item>>(
      `/items${query ? `?${query}` : ""}`,
    );
  }

  async getItem(id: string): Promise<Item> {
    return this.request<Item>(`/items/${id}`);
  }

  async createItem(data: {
    name: string;
    description?: string;
    categoryId: string;
    imageUrl?: string;
    locationId?: string;
    tags?: string[];
  }): Promise<Item> {
    return this.request<Item>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    return this.request<Item>(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: string): Promise<void> {
    return this.request<void>(`/items/${id}`, { method: "DELETE" });
  }

  async getMyPendingItems(): Promise<Item[]> {
    return this.request<Item[]>('/items/my-pending');
  }

  async updateItemStatus(id: string, status: string): Promise<Item> {
    return this.request<Item>(`/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Categories
  async getCategories(organizationId: string): Promise<Category[]> {
    return this.request<Category[]>(
      `/categories?organizationId=${organizationId}`,
    );
  }

  async createCategory(data: {
    name: string;
    description?: string;
    parentId?: string;
  }): Promise<Category> {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(
    id: string,
    data: { name?: string; description?: string; parentId?: string },
  ): Promise<Category> {
    return this.request<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request<void>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Reservations
  async getReservations(userId?: string): Promise<Reservation[]> {
    const query = userId ? `?userId=${userId}` : "";
    return this.request<Reservation[]>(`/reservations${query}`);
  }

  async checkAvailability(
    itemId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ available: boolean }> {
    const query = new URLSearchParams({ startDate, endDate }).toString();
    return this.request<{ available: boolean }>(
      `/reservations/availability/${itemId}?${query}`,
    );
  }

  async createReservation(data: {
    itemId: string;
    startDate: string;
    endDate: string;
  }): Promise<Reservation> {
    return this.request<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelReservation(id: string): Promise<void> {
    return this.request<void>(`/reservations/${id}`, { method: "DELETE" });
  }

  // Loans
  async getLoans(params?: {
    active?: boolean;
    overdue?: boolean;
    userId?: string;
  }): Promise<Loan[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<Loan[]>(`/loans${query ? `?${query}` : ""}`);
  }

  async checkout(data: {
    itemId: string;
    userId?: string;
    reservationId?: string;
    dueDate: string;
  }): Promise<Loan> {
    return this.request<Loan>("/loans/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async checkin(loanId: string, opts?: { damageNote?: string; condition?: string }): Promise<Loan> {
    return this.request<Loan>(`/loans/${loanId}/checkin`, {
      method: "POST",
      body: JSON.stringify(opts ?? {}),
    });
  }

  // Users
  async getUsers(): Promise<Array<{ membership: Membership; user: User }>> {
    return this.request<Array<{ membership: Membership; user: User }>>(
      "/organizations/members",
    );
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Organizations
  async getPublicOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>("/organizations/public");
  }

  async getMyMemberships(): Promise<Membership[]> {
    return this.request<Membership[]>("/organizations/me");
  }

  async createOrganization(data: {
    name: string;
    slug?: string;
    description?: string;
    type?: string;
  }): Promise<{ organization: Organization; membership: Membership }> {
    return this.request<{ organization: Organization; membership: Membership }>(
      "/organizations",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async getOrganizationMembers(): Promise<
    Array<{ membership: Membership; user: User }>
  > {
    return this.request<Array<{ membership: Membership; user: User }>>(
      "/organizations/members",
    );
  }

  async addOrganizationMember(payload: {
    email: string;
    role?: string;
  }): Promise<Membership> {
    return this.request<Membership>("/organizations/members", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateMembership(
    membershipId: string,
    payload: Partial<Membership>,
  ): Promise<Membership> {
    return this.request<Membership>(`/organizations/members/${membershipId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async getGroups(): Promise<Array<MemberGroup & { memberCount: number }>> {
    return this.request<Array<MemberGroup & { memberCount: number }>>(
      "/organizations/groups",
    );
  }

  async createGroup(data: {
    name: string;
    description?: string;
  }): Promise<MemberGroup> {
    return this.request<MemberGroup>("/organizations/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async assignGroupMember(
    groupId: string,
    membershipId: string,
  ): Promise<void> {
    return this.request<void>(`/organizations/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ membershipId }),
    });
  }

  // Uploads
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(this.activeOrganizationId && {
        "X-Organization-Id": this.activeOrganizationId,
      }),
    };
    // Note: Do NOT set Content-Type header - browser will set it with boundary

    const response = await fetch(`${API_BASE_URL}/uploads/image`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Upload failed" }));
      throw new Error(errorData.error || "Failed to upload image");
    }

    const data = await response.json();
    return data;
  }

  // Comments
  async getItemComments(itemId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/comments/item/${itemId}`);
  }

  async createComment(data: {
    itemId: string;
    content: string;
  }): Promise<Comment> {
    return this.request<Comment>("/comments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(id: string): Promise<void> {
    return this.request<void>(`/comments/${id}`, { method: "DELETE" });
  }

  // Reviews
  async getItemReviews(itemId: string): Promise<Review[]> {
    return this.request<Review[]>(`/reviews/item/${itemId}`);
  }

  async getItemReviewStats(itemId: string): Promise<ReviewStats> {
    return this.request<ReviewStats>(`/reviews/item/${itemId}/stats`);
  }

  async createReview(data: {
    itemId: string;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    return this.request<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteReview(id: string): Promise<void> {
    return this.request<void>(`/reviews/${id}`, { method: "DELETE" });
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return this.request<Location[]>("/locations");
  }

  async createLocation(data: { name: string; address?: string; description?: string }): Promise<Location> {
    return this.request<Location>("/locations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLocation(id: string, data: { name?: string; address?: string | null; description?: string | null }): Promise<Location> {
    return this.request<Location>(`/locations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: string): Promise<void> {
    return this.request<void>(`/locations/${id}`, { method: "DELETE" });
  }

  // Manuals
  async getItemManuals(itemId: string): Promise<ItemManual[]> {
    return this.request<ItemManual[]>(`/items/${itemId}/manuals`);
  }

  async createManual(itemId: string, data: { type: "PDF" | "LINK" | "TEXT"; label: string; url?: string; content?: string }): Promise<ItemManual> {
    return this.request<ItemManual>(`/items/${itemId}/manuals`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteManual(itemId: string, manualId: string): Promise<void> {
    return this.request<void>(`/items/${itemId}/manuals/${manualId}`, { method: "DELETE" });
  }

  async uploadManual(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(this.activeOrganizationId && { "X-Organization-Id": this.activeOrganizationId }),
    };

    const response = await fetch(`${API_BASE_URL}/uploads/manual`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(errorData.error || "Failed to upload manual");
    }

    return response.json();
  }

  // Item images
  async addItemImage(itemId: string, url: string): Promise<{ id: string; url: string; position: number }> {
    return this.request<{ id: string; url: string; position: number }>(`/items/${itemId}/images`, {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  }

  async deleteItemImage(itemId: string, imageId: string): Promise<void> {
    return this.request<void>(`/items/${itemId}/images/${imageId}`, { method: "DELETE" });
  }

  async reorderItemImages(itemId: string, imageIds: string[]): Promise<void> {
    return this.request<void>(`/items/${itemId}/images/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ imageIds }),
    });
  }

  // Item approval
  async approveItem(id: string): Promise<Item> {
    return this.request<Item>(`/items/${id}/approve`, { method: "POST" });
  }

  async rejectItem(id: string, note?: string): Promise<Item> {
    return this.request<Item>(`/items/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  // Admin
  async getAdminOrganizations(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    memberCount: number;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    return this.request("/admin/organizations");
  }

  async getAdminUsers(): Promise<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    memberships: Array<{
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      role: string;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    return this.request("/admin/users");
  }

  async getAdminOrganization(orgId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: string | null;
    itemCount: number;
    members: Array<{
      userId: string;
      userEmail: string;
      userName: string;
      userRole: string;
      membershipRole: string;
      status: string;
      joinedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.request(`/admin/organizations/${orgId}`);
  }

  async updateAdminUser(
    userId: string,
    data: { name?: string; role?: string; email?: string }
  ): Promise<{ id: string; email: string; name: string; role: string }> {
    return this.request(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: string = "MEMBER"
  ): Promise<{ id: string; role: string; status: string }> {
    return this.request(`/admin/users/${userId}/memberships`, {
      method: "POST",
      body: JSON.stringify({ organizationId, role }),
    });
  }

  async removeUserFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<{ deleted: boolean }> {
    return this.request(`/admin/users/${userId}/memberships/${organizationId}`, {
      method: "DELETE",
    });
  }

  async updateAdminOrganization(
    orgId: string,
    data: { name?: string; description?: string; slug?: string; type?: string | null }
  ): Promise<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: string | null;
    memberCount: number;
    itemCount: number;
  }> {
    return this.request(`/admin/organizations/${orgId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAdminOrganization(orgId: string): Promise<{ deleted: boolean }> {
    return this.request(`/admin/organizations/${orgId}`, {
      method: "DELETE",
    });
  }

  async getEmailLogs(limit = 100): Promise<Array<{
    id: string;
    to: string;
    subject: string;
    event: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>> {
    return this.request(`/admin/email-logs?limit=${limit}`);
  }

  async getAuditLogs(params?: {
    limit?: number;
    orgId?: string;
    action?: string;
    userId?: string;
    from?: string;
    to?: string;
  }): Promise<Array<{
    id: string;
    organizationId: string;
    organization: { id: string; name: string } | null;
    actorUserId: string | null;
    actor: { id: string; name: string; email: string } | null;
    action: string;
    entityType: string;
    entityId: string | null;
    description: string | null;
    metadata: string | null;
    createdAt: string;
  }>> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.orgId) qs.set("orgId", params.orgId);
    if (params?.action) qs.set("action", params.action);
    if (params?.userId) qs.set("userId", params.userId);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    return this.request(`/admin/audit-logs?${qs.toString()}`);
  }

  async sendTestEmail(to: string, subject: string, text: string): Promise<void> {
    await this.request("/admin/send-test-email", {
      method: "POST",
      body: JSON.stringify({ to, subject, text }),
    });
  }
}

export const apiClient = new ApiClient();
