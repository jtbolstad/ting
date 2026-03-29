import { http, HttpResponse } from 'msw';
import { mockOrganization } from '../fixtures/organizations';

export const organizationHandlers = [
  http.get('*/api/organizations/public', () => {
    return HttpResponse.json({
      success: true,
      data: [mockOrganization],
    });
  }),
];
