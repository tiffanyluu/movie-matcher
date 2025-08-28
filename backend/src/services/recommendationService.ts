import pool from '../db';
import { getFromCache, setInCache, deleteFromCache } from '../db/redis';

// Dot Product: Measures the raw amount of agreement/overlap between two movies' 
// rating patterns among common users.

// Magnitude: Normalizes the comparison so that similarity scores represent percentage 
// agreement rather than being biased by the number of ratings.

// Cosine similarity converts "how much overlap" into "what percentage agreement" 
// so you can fairly compare any two movies regardless of how many people rated them.

const cosineSim = (a: Map<number, number>, b: Map<number, number>) => {
  let dot = 0, magA = 0, magB = 0;
  for (const [u, rA] of a) {
    const rB = b.get(u);
    if (rB !== undefined) dot += rA * rB;
    magA += rA * rA;
  }
  for (const r of b.values()) magB += r * r;
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
};

const getRatings = async () => {
  const res = await pool.query('SELECT user_id, movie_id, rating FROM ratings');
  const data = new Map<number, Map<number, number>>();
  for (const { user_id, movie_id, rating } of res.rows) {
    if (!data.has(movie_id)) data.set(movie_id, new Map());
    data.get(movie_id)!.set(user_id, rating);
  }
  return data;
};

const getPopular = async (exclude: number[], limit: number) => {
  const res = await pool.query(
    `SELECT m.id, m.title, m.genre, m.description
     FROM movies m
     LEFT JOIN ratings r ON m.id = r.movie_id
     WHERE NOT (m.id = ANY($1))
     GROUP BY m.id
     ORDER BY COUNT(*) FILTER (WHERE r.rating = 1) DESC
     LIMIT $2`,
    [exclude, limit]
  );
  return res.rows.map((r: any) => ({ ...r, explanation: 'Popular among users' }));
};

export const generateRecommendations = async (userId: number, limit = 5) => {
  const cacheKey = `recommendations:${userId}:${limit}`;
  const cached = await getFromCache(cacheKey);
  if (cached) return JSON.parse(cached);

  const { rows } = await pool.query('SELECT movie_id, rating FROM ratings WHERE user_id = $1', [userId]);
  const liked = rows.filter(r => r.rating === 1).map(r => r.movie_id);
  const rated = rows.map(r => r.movie_id);

  if (!liked.length) {
    const recs = await getPopular(rated, limit);
    await setInCache(cacheKey, JSON.stringify(recs), 1800);
    return recs;
  }

  const ratingsData = await getRatings();
  const scores = new Map<number, number>();

  for (const likedId of liked) {
    const likedRatings = ratingsData.get(likedId);
    if (!likedRatings) continue;

    for (const [movieId, otherRatings] of ratingsData.entries()) {
      if (rated.includes(movieId) || movieId === likedId) continue;
      const sim = cosineSim(likedRatings, otherRatings);
      if (sim) scores.set(movieId, (scores.get(movieId) || 0) + sim);
    }
  }

  const topIds = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (!topIds.length) {
    const recs = await getPopular(rated, limit);
    await setInCache(cacheKey, JSON.stringify(recs), 1800);
    return recs;
  }

  const { rows: movies } = await pool.query('SELECT id, title, genre, description FROM movies WHERE id = ANY($1)', [topIds]);
  let recs = movies.map((m: any) => ({ ...m, explanation: 'Recommended for you' }));

  if (recs.length < limit) {
    const popular = await getPopular(rated.concat(recs.map(m => m.id)), limit - recs.length);
    recs = [...recs, ...popular];
  }

  await setInCache(cacheKey, JSON.stringify(recs), 1800);
  return recs;
};

export const invalidateUserCache = async (userId: number) => {
  const limits = [5, 10, 20];
  for (const limit of limits) {
    await deleteFromCache(`recommendations:${userId}:${limit}`);
  }
};