import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;
let isConnected = false;

const initializeRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => { 
      console.warn('Redis error:', err.message);
      isConnected = false; 
    });
    redisClient.on('connect', () => { isConnected = true; });

    await redisClient.connect();
    console.log('Redis connected');
  } catch (error) {
    console.warn('Redis unavailable, continuing without cache:', error instanceof Error ? error.message : error);
    redisClient = null;
    isConnected = false;
  }
};

const getFromCache = async (key: string): Promise<string | null> => {
  if (!isConnected || !redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.warn('Redis GET error:', error instanceof Error ? error.message : error);
    return null;
  }
};

const setInCache = async (key: string, value: string, ttlSeconds = 1800): Promise<void> => {
  if (!isConnected || !redisClient) return;
  try {
    await redisClient.setEx(key, ttlSeconds, value);
  } catch (error) {
    console.warn('Redis SET error:', error instanceof Error ? error.message : error);
  }
};

const deleteFromCache = async (key: string): Promise<void> => {
  if (!isConnected || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    console.warn('Redis DELETE error:', error instanceof Error ? error.message : error);
  }
};

const closeRedis = async () => {
  if (redisClient) {
      await redisClient.disconnect();
  }
};

export { initializeRedis, getFromCache, setInCache, deleteFromCache, closeRedis };