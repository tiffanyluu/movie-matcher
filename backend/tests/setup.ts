import { vi } from 'vitest';

const mockQuery = vi.fn();
const mockHash = vi.fn().mockResolvedValue('hashed');
const mockCompare = vi.fn().mockResolvedValue(true);
const mockSign = vi.fn().mockReturnValue('test-token');
const mockVerify = vi.fn();
const mockGetFromCache = vi.fn().mockResolvedValue(null);
const mockSetInCache = vi.fn().mockResolvedValue(undefined);
const mockDeleteFromCache = vi.fn().mockResolvedValue(undefined);
const mockGenerateRecommendations = vi.fn();
const mockInvalidateUserCache = vi.fn();

vi.mock('../src/db/index', () => ({ default: { query: mockQuery } }));
vi.mock('../src/db', () => ({ default: { query: mockQuery } }));
vi.mock('../src/db/redis', () => ({
  getFromCache: mockGetFromCache,
  setInCache: mockSetInCache,
  deleteFromCache: mockDeleteFromCache,
  initializeRedis: vi.fn(),
  closeRedis: vi.fn()
}));
vi.mock('bcrypt', () => ({ 
  hash: mockHash, 
  compare: mockCompare,
  default: { hash: mockHash, compare: mockCompare }
}));
vi.mock('jsonwebtoken', () => ({ 
  sign: mockSign, 
  verify: mockVerify,
  default: { sign: mockSign, verify: mockVerify }
}));
vi.mock('../src/services/recommendationService', () => ({
  generateRecommendations: mockGenerateRecommendations,
  invalidateUserCache: mockInvalidateUserCache
}));

export const mockPool = { query: mockQuery };
export const mockRedis = { getFromCache: mockGetFromCache, setInCache: mockSetInCache, deleteFromCache: mockDeleteFromCache };
export const mockBcrypt = { hash: mockHash, compare: mockCompare };
export const mockJwt = { sign: mockSign, verify: mockVerify };
export const mockRecommendationService = { generateRecommendations: mockGenerateRecommendations, invalidateUserCache: mockInvalidateUserCache };

export const testUser = { id: 1, name: 'John', email: 'john@test.com', password_hash: 'hash' };
export const testMovie = { id: 1, title: 'Matrix', genre: 'Action', description: 'Sci-fi movie' };
export const testToken = 'test-token';

export const resetMocks = () => {
  vi.clearAllMocks();
  mockHash.mockResolvedValue('hashed');
  mockCompare.mockResolvedValue(true);
  mockSign.mockReturnValue('test-token');
  mockGetFromCache.mockResolvedValue(null);
  mockSetInCache.mockResolvedValue(undefined);
  mockDeleteFromCache.mockResolvedValue(undefined);
};