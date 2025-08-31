import { vi, describe, it, expect, beforeEach } from 'vitest';

const testMovie = { id: 1, title: 'Matrix', genre: 'Action', description: 'Sci-fi movie' };

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

describe('Recommendation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetFromCache.mockResolvedValue(null);
    mocks.mockSetInCache.mockResolvedValue(undefined);
    mocks.mockDeleteFromCache.mockResolvedValue(undefined);
  });

  it('returns cached recommendations', async () => {
    const cached = [{ ...testMovie, explanation: 'Cached' }];
    mocks.mockGetFromCache.mockResolvedValueOnce(JSON.stringify(cached));

    const result = await generateRecommendations(1, 5);

    expect(result).toEqual(cached);
    expect(mocks.mockQuery).not.toHaveBeenCalled();
  });

  it('returns popular movies for new users', async () => {
    mocks.mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ ...testMovie, explanation: 'Popular among users' }] });

    const result = await generateRecommendations(1, 1);

    expect(result[0].explanation).toBe('Popular among users');
  });

  it('returns genre-based recommendations when no collaborative data', async () => {
    mocks.mockQuery.mockResolvedValueOnce({ rows: [{ movie_id: 1, rating: 1 }] }) // user ratings
      .mockResolvedValueOnce({ rows: [{ user_id: 1, movie_id: 1, rating: 1 }] }) // no collaborative
      .mockResolvedValueOnce({ rows: [{ genre: 'Action' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, title: 'Action Movie', genre: 'Action', description: 'Test' }] });

    const result = await generateRecommendations(1, 1);
    expect(result[0].explanation).toBe('Because you liked Action movies');
  });

  it('generates collaborative recommendations', async () => {
    mocks.mockQuery.mockResolvedValueOnce({ rows: [{ movie_id: 1, rating: 1 }] })
      .mockResolvedValueOnce({ rows: [
        { user_id: 1, movie_id: 1, rating: 1 },
        { user_id: 2, movie_id: 1, rating: 1 },
        { user_id: 2, movie_id: 2, rating: 1 }
      ] })
      .mockResolvedValueOnce({ rows: [{ id: 2, title: 'Similar Movie', genre: 'Action', description: 'Test' }] });

    const result = await generateRecommendations(1, 1);
    expect(result[0].explanation).toBe('Recommended for you');
  });

  it('uses hybrid approach when partial collaborative data', async () => {
    mocks.mockQuery.mockResolvedValueOnce({ rows: [{ movie_id: 1, rating: 1 }] })
      .mockResolvedValueOnce({ rows: [
        { user_id: 1, movie_id: 1, rating: 1 },
        { user_id: 2, movie_id: 1, rating: 1 },
        { user_id: 2, movie_id: 2, rating: 1 }
      ] })
      .mockResolvedValueOnce({ rows: [{ id: 2, title: 'Collab Movie', genre: 'Action', description: 'Test' }] })
      .mockResolvedValueOnce({ rows: [{ genre: 'Action' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, title: 'Genre Movie', genre: 'Action', description: 'Test' }] });

    const result = await generateRecommendations(1, 5);
    expect(result.some(r => r.explanation === 'Recommended for you')).toBe(true);
    expect(result.some(r => r.explanation.includes('Because you liked'))).toBe(true);
  });

  it('clears cache for multiple limits', async () => {
    await invalidateUserCache(1);
    expect(mocks.mockDeleteFromCache).toHaveBeenCalledTimes(3);
  });
});
