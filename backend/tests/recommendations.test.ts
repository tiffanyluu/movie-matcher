import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  mockVerify: vi.fn(),
  mockGenerateRecommendations: vi.fn()
}));

vi.mock('jsonwebtoken', () => ({ 
  default: { verify: mocks.mockVerify },
  verify: mocks.mockVerify 
}));
vi.mock('../src/services/recommendationService', () => ({
  generateRecommendations: mocks.mockGenerateRecommendations
}));

import app from '../src/server';

const testToken = 'test-token';
const testMovie = { id: 1, title: 'Matrix', genre: 'Action', description: 'Sci-fi movie' };

describe('Recommendations Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockVerify.mockImplementation((token, secret, callback: any) => 
      callback(null, { userId: 1 })
    );
  });

  describe('GET /recommendations', () => {
    it('returns recommendations', async () => {
      const recs = [{ ...testMovie, explanation: 'Recommended for you' }];
      mocks.mockGenerateRecommendations.mockResolvedValueOnce(recs);

      const res = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toHaveLength(1);
      expect(res.body.userId).toBe(1);
      expect(mocks.mockGenerateRecommendations).toHaveBeenCalledWith(1, 5);
    });

    it('respects limit parameter', async () => {
      mocks.mockGenerateRecommendations.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/recommendations?limit=10')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(mocks.mockGenerateRecommendations).toHaveBeenCalledWith(1, 10);
    });

    it('validates limit range', async () => {
      const res = await request(app)
        .get('/recommendations?limit=51')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(400);
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/recommendations');
      expect(res.status).toBe(401);
    });
  });
});