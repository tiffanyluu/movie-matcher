import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockHash: vi.fn(),
  mockCompare: vi.fn(),
  mockSign: vi.fn(),
  mockVerify: vi.fn(),
  mockGenerateRecommendations: vi.fn(),
  mockInvalidateUserCache: vi.fn()
}));

vi.mock('../src/db', () => ({ default: { query: mocks.mockQuery } }));
vi.mock('bcrypt', () => ({ 
  default: { hash: mocks.mockHash, compare: mocks.mockCompare },
  hash: mocks.mockHash, 
  compare: mocks.mockCompare 
}));
vi.mock('jsonwebtoken', () => ({ 
  default: { sign: mocks.mockSign, verify: mocks.mockVerify },
  sign: mocks.mockSign, 
  verify: mocks.mockVerify 
}));
vi.mock('../src/services/recommendationService', () => ({
  generateRecommendations: mocks.mockGenerateRecommendations,
  invalidateUserCache: mocks.mockInvalidateUserCache
}));

import app from '../src/server';

const testUser = { id: 1, name: 'John', email: 'john@test.com', password_hash: 'hash' };
const testMovie = { id: 1, title: 'Matrix', genre: 'Action', description: 'Sci-fi movie' };

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockHash.mockResolvedValue('hashed');
    mocks.mockCompare.mockResolvedValue(true);
    mocks.mockSign.mockReturnValue('test-token');
    mocks.mockVerify.mockImplementation((token, secret, callback: any) => 
      callback(null, { userId: 1 })
    );
  });

  it('completes full user journey', async () => {
    // 1. Signup
    mocks.mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [testUser] });

    const signup = await request(app)
      .post('/users/signup')
      .send({ name: 'John', email: 'john@test.com', password: 'pass' });

    expect(signup.status).toBe(201);

    // 2. Get movies
    mocks.mockQuery.mockResolvedValueOnce({ rows: [testMovie] });

    const movies = await request(app).get('/movies');
    expect(movies.status).toBe(200);

    // 3. Rate movie
    mocks.mockQuery.mockResolvedValueOnce({ rows: [] });

    const rating = await request(app)
      .post('/ratings')
      .set('Authorization', 'Bearer test-token')
      .send({ movieId: 1, rating: 1 });

    expect(rating.status).toBe(200);

    // 4. Get recommendations
    const recs = [{ ...testMovie, explanation: 'For you' }];
    mocks.mockGenerateRecommendations.mockResolvedValueOnce(recs);

    const recommendations = await request(app)
      .get('/recommendations')
      .set('Authorization', 'Bearer test-token');

    expect(recommendations.status).toBe(200);
    expect(recommendations.body.recommendations).toHaveLength(1);
  });

  it('handles health check', async () => {
    const res = await request(app).get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('handles 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    
    expect(res.status).toBe(404);
  });
});