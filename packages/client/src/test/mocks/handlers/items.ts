import { http, HttpResponse } from 'msw';
import { mockItem, mockItems } from '../fixtures/items';

export const itemHandlers = [
  http.get('*/api/items', () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: mockItems,
        total: mockItems.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });
  }),

  http.get('*/api/items/:id', ({ params }) => {
    const item = mockItems.find(
      (i) => i.id === params.id || i.slug === params.id
    );
    if (!item) {
      return HttpResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: item });
  }),

  http.patch('*/api/items/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const item = mockItems.find(
      (i) => i.id === params.id || i.slug === params.id
    ) ?? mockItem;
    return HttpResponse.json({ success: true, data: { ...item, ...body } });
  }),
];
