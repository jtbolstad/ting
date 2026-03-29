import { http, HttpResponse } from 'msw';
import { mockUser, mockMembership } from '../fixtures/auth';

export const authHandlers = [
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
        memberships: [mockMembership],
        activeMembershipId: mockMembership.id,
      },
    });
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    if (email === 'lars@ting.com' && password === 'user123') {
      return HttpResponse.json({
        success: true,
        data: { token: 'mock-token', user: mockUser },
      });
    }
    return HttpResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }),
];
