import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockSign: vi.fn(),
  mockVerify: vi.fn(),
  mockInvalidateUserCache: vi.fn()
}));

vi.mock('../src/db', () => ({ default: { query: mocks.mockQuery } }));
vi.mock('jsonwebtoken', () => ({ 
  default: { sign: mocks.mockSign, verify: mocks.mockVerify },
  sign: mocks.mockSign, 
  verify: mocks.mockVerify 
}));
vi.mock('../src/services/recommendationService', () => ({
  invalidateUserCache: mocks.mockInvalidateUserCache
}));

import app from '../src/server';

const testToken = 'test-token';

describe('Ratings Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockVerify.mockImplementation((token, secret, callback: any) => 
      callback(null, { userId: 1 })
    );
  });

  describe('POST /ratings', () => {
    it('creates rating', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/ratings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ movieId: 1, rating: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('validates rating values', async () => {
      const res = await request(app)
        .post('/ratings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ movieId: 1, rating: 5 });

      expect(res.status).toBe(400);
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/ratings')
        .send({ movieId: 1, rating: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /ratings', () => {
    it('returns user ratings', async () => {
      const ratings = [{ movie_id: 1, rating: 1 }];
      mocks.mockQuery.mockResolvedValueOnce({ rows: ratings });

      const res = await request(app)
        .get('/ratings')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/ratings');
      expect(res.status).toBe(401);
    });
  });
});