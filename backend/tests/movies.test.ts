import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  mockQuery: vi.fn()
}));

vi.mock('../src/db', () => ({ default: { query: mocks.mockQuery } }));

import app from '../src/server';

const testMovie = { id: 1, title: 'Matrix', genre: 'Action', description: 'Sci-fi movie' };

describe('Movie Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /movies', () => {
    it('returns movies list', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [testMovie] });

      const res = await request(app).get('/movies');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Matrix');
    });

    it('handles empty results', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/movies');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /movies/:id', () => {
    it('returns specific movie', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [testMovie] });

      const res = await request(app).get('/movies/1');

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Matrix');
    });

    it('returns 404 for missing movie', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/movies/999');

      expect(res.status).toBe(404);
    });

    it('validates movie ID', async () => {
      const res = await request(app).get('/movies/invalid');
      expect(res.status).toBe(400);
    });
  });
});