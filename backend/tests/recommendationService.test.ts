import { vi, describe, it, expect, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockGetFromCache: vi.fn(),
  mockSetInCache: vi.fn(),
  mockDeleteFromCache: vi.fn()
}));

vi.mock('../src/db', () => ({ default: { query: mocks.mockQuery } }));
vi.mock('../src/db/redis', () => ({
  getFromCache: mocks.mockGetFromCache,
  setInCache: mocks.mockSetInCache,
  deleteFromCache: mocks.mockDeleteFromCache
}));

import { generateRecommendations, invalidateUserCache } from '../src/services/recommendationService';

const testMovie = { id: 1, title: 'Matrix', genre: 'Action', description: 'Sci-fi movie' };

describe('Recommendation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetFromCache.mockResolvedValue(null);
    mocks.mockSetInCache.mockResolvedValue(undefined);
    mocks.mockDeleteFromCache.mockResolvedValue(undefined);
  });

  describe('generateRecommendations', () => {
    it('returns cached recommendations', async () => {
      const cached = [{ ...testMovie, explanation: 'Cached' }];
      mocks.mockGetFromCache.mockResolvedValueOnce(JSON.stringify(cached));

      const result = await generateRecommendations(1, 5);

      expect(result).toEqual(cached);
      expect(mocks.mockGetFromCache).toHaveBeenCalledWith('recommendations:1:5');
      expect(mocks.mockQuery).not.toHaveBeenCalled();
    });

    it('returns popular movies for new users', async () => {
      mocks.mockGetFromCache.mockResolvedValueOnce(null);
      mocks.mockQuery
        .mockResolvedValueOnce({ rows: [] }) // no ratings
        .mockResolvedValueOnce({ rows: [{ ...testMovie, explanation: 'Popular among users' }] }); // popular movies

      const result = await generateRecommendations(1, 1);

      expect(result).toHaveLength(1);
      expect(result[0].explanation).toBe('Popular among users');
      expect(mocks.mockSetInCache).toHaveBeenCalled();
    });

    it('generates ML recommendations for active users', async () => {
      mocks.mockGetFromCache.mockResolvedValueOnce(null);
      mocks.mockQuery
        .mockResolvedValueOnce({ rows: [{ movie_id: 1, rating: 1 }] }) // user ratings
        .mockResolvedValueOnce({ // all ratings for similarity
          rows: [
            { user_id: 1, movie_id: 1, rating: 1 },
            { user_id: 2, movie_id: 1, rating: 1 },
            { user_id: 2, movie_id: 2, rating: 1 }
          ]
        })
        .mockResolvedValueOnce({ rows: [{ ...testMovie, id: 2, explanation: 'Recommended for you' }] }); // recommended movies

      const result = await generateRecommendations(1, 1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
      expect(result[0].explanation).toBe('Recommended for you');
    });
  });

  describe('invalidateUserCache', () => {
    it('clears cache for multiple limits', async () => {
      await invalidateUserCache(1);

      expect(mocks.mockDeleteFromCache).toHaveBeenCalledTimes(3);
      expect(mocks.mockDeleteFromCache).toHaveBeenCalledWith('recommendations:1:5');
      expect(mocks.mockDeleteFromCache).toHaveBeenCalledWith('recommendations:1:10');
      expect(mocks.mockDeleteFromCache).toHaveBeenCalledWith('recommendations:1:20');
    });
  });
});