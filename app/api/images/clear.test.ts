// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    })),
  },
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  image: {
    deleteMany: jest.fn(),
  },
}));

import { DELETE } from './clear/route';
import db from '@/lib/db';

describe('/api/images/clear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should clear all images from database', async () => {
    const mockDeleteMany = db.image.deleteMany as jest.Mock;
    mockDeleteMany.mockResolvedValue({ count: 5 });

    const mockRequest = {} as any;

    const response = await DELETE(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      message: 'All images cleared successfully',
      count: 5,
    });
    expect(mockDeleteMany).toHaveBeenCalledWith({});
  });

  test('should handle database errors', async () => {
    const mockDeleteMany = db.image.deleteMany as jest.Mock;
    mockDeleteMany.mockRejectedValue(new Error('Database error'));

    const mockRequest = {} as any;

    const response = await DELETE(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to clear images' });
  });
});
