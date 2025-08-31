import pool from '../db';
import { getFromCache, setInCache, deleteFromCache } from '../db/redis';

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

const getMovies = async (ids: number[], explanation?: string) => {
  if (!ids.length) return [];
  const { rows } = await pool.query(
    'SELECT id, title, genre, description FROM movies WHERE id = ANY($1)',
    [ids]
  );
  return rows.map((m: any) => ({ ...m, explanation: explanation || 'Recommended for you' }));
};

const getPopular = async (exclude: number[], limit: number) => {
  const { rows } = await pool.query(
    `SELECT m.id, m.title, m.genre, m.description
     FROM movies m
     LEFT JOIN ratings r ON m.id = r.movie_id
     WHERE NOT (m.id = ANY($1))
     GROUP BY m.id
     ORDER BY COUNT(*) FILTER (WHERE r.rating = 1) DESC
     LIMIT $2`,
    [exclude, limit]
  );
  return rows.map((r: any) => ({ ...r, explanation: 'Popular among users' }));
};

const getGenreBasedRecommendations = async (likedIds: number[], exclude: number[], limit: number) => {
  const { rows: genreRows } = await pool.query(
    'SELECT DISTINCT genre FROM movies WHERE id = ANY($1)', 
    [likedIds]
  );
  
  // Extract individual genres and deduplicate
  const allGenres = genreRows.flatMap((r: any) => r.genre.split(', ').map((g: string) => g.trim()));
  const uniqueGenres = [...new Set(allGenres)];
  
  console.log(`Looking for genres: ${uniqueGenres.slice(0, 3)}, excluding ${exclude.length} movies`);
  
  if (!uniqueGenres.length) return getPopular(exclude, limit);

  // Use LIKE matching for the first 3 most common genres
  const topGenres = uniqueGenres.slice(0, 3);
  const genreParams = topGenres.map((g: string) => `%${g}%`);

  const { rows: movies } = await pool.query(
    `SELECT DISTINCT id, title, genre, description 
     FROM movies 
     WHERE (${topGenres.map((_, i) => `genre LIKE $${i + 1}`).join(' OR ')})
     AND NOT (id = ANY($${topGenres.length + 1}))
     LIMIT $${topGenres.length + 2}`,
    [...genreParams, exclude, limit * 2]
  );

  console.log(`Found ${movies.length} potential genre-based movies`);

  // Shuffle and limit
  const shuffled = movies.sort(() => Math.random() - 0.5).slice(0, limit);

  // Create cleaner genre explanation
  const genreText = topGenres.length === 1
    ? topGenres[0]
    : topGenres.slice(0, -1).join(', ') + ' and ' + topGenres.slice(-1);

  return shuffled.map((m: any) => ({ ...m, explanation: `Because you liked ${genreText} movies` }));
};

export const generateRecommendations = async (userId: number, limit = 5) => {
  const startTime = Date.now();
  const cacheKey = `recommendations:${userId}:${limit}`;
  
  const cached = await getFromCache(cacheKey);
  if (cached) {
    const elapsedTime = Date.now() - startTime;
    console.log(`✅ Cached recommendations served in ${elapsedTime}ms`);
    return JSON.parse(cached);
  }
 
  console.log(`❌ Generating new recommendations...`);
  const { rows } = await pool.query('SELECT movie_id, rating FROM ratings WHERE user_id = $1', [userId]);
  const liked = rows.filter(r => r.rating === 1).map(r => r.movie_id);
  const rated = rows.map(r => r.movie_id);
 
  if (!liked.length) {
    const recs = await getPopular(rated, limit);
    await setInCache(cacheKey, JSON.stringify(recs), 1800);
    const elapsedTime = Date.now() - startTime;
    console.log(`⚡ Popular recommendations generated and cached in ${elapsedTime}ms`);
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
 
  let recs: any[];
  if (!topIds.length) {
    recs = await getGenreBasedRecommendations(liked, rated, limit);
  } else if (topIds.length < limit) {
    const collabRecs = await getMovies(topIds);
    const genreRecs = await getGenreBasedRecommendations(liked, [...rated, ...topIds], limit - topIds.length);
    recs = [...collabRecs, ...genreRecs];
  } else {
    recs = await getMovies(topIds);
  }
 
  await setInCache(cacheKey, JSON.stringify(recs), 1800);
  const elapsedTime = Date.now() - startTime;
  console.log(`⚡ New recommendations generated and cached in ${elapsedTime}ms`);
  return recs;
 };

export const invalidateUserCache = async (userId: number) => {
  for (const limit of [5, 10, 20]) {
    await deleteFromCache(`recommendations:${userId}:${limit}`);
  }
};
