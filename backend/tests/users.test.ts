import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockHash: vi.fn(),
  mockCompare: vi.fn(),
  mockSign: vi.fn(),
  mockVerify: vi.fn()
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

// Import after mocks are set up
import app from '../src/server';

const testUser = { id: 1, name: 'John', email: 'john@test.com', password_hash: 'hash' };
const testToken = 'test-token';

describe('User Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockHash.mockResolvedValue('hashed');
    mocks.mockCompare.mockResolvedValue(true);
    mocks.mockSign.mockReturnValue(testToken);
  });

  describe('POST /users/signup', () => {
    it('creates new user', async () => {
      mocks.mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [testUser] });

      const res = await request(app)
        .post('/users/signup')
        .send({ name: 'John', email: 'john@test.com', password: 'pass' });

      expect(res.status).toBe(201);
      expect(res.body.user.name).toBe('John');
      expect(res.body.token).toBe(testToken);
    });

    it('rejects existing email', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [testUser] });

      const res = await request(app)
        .post('/users/signup')
        .send({ name: 'John', email: 'john@test.com', password: 'pass' });

      expect(res.status).toBe(409);
    });

    it('requires all fields', async () => {
      const res = await request(app)
        .post('/users/signup')
        .send({ name: 'John' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /users/login', () => {
    it('logs in valid user', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [testUser] });

      const res = await request(app)
        .post('/users/login')
        .send({ email: 'john@test.com', password: 'pass' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe(testToken);
    });

    it('rejects invalid email', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/users/login')
        .send({ email: 'wrong@test.com', password: 'pass' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/profile', () => {
    it('returns profile with valid token', async () => {
      mocks.mockVerify.mockImplementation((token, secret, callback: any) => 
        callback(null, { userId: 1 })
      );
      mocks.mockQuery.mockResolvedValueOnce({ rows: [testUser] });

      const res = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('John');
    });

    it('rejects without token', async () => {
      const res = await request(app).get('/users/profile');
      expect(res.status).toBe(401);
    });
  });
});