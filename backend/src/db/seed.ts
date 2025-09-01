import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Pool } from 'pg';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const seedMovies = async () => {
  const csvFilePath = path.join(__dirname, 'sampled.csv');

  const movies: {title: string; genre: string; description: string}[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        movies.push({
          title: row.title,
          genre: row.genres,
          description: row.overview
        });
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });

  console.log(`Seeding ${movies.length} movies...`);

  const connectionConfig = process.env.NODE_ENV === 'production' ? {
    host: 'db.gepmolswcdbjckzyqiyj.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'ZPwYCYYFaWkFLjlH',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  } : {
    connectionString: process.env.DATABASE_URL,
    ssl: false
  };

  const pool = new Pool(connectionConfig);

  const client = await pool.connect();
  try {
    for (const movie of movies) {
      await client.query(
        'INSERT INTO movies (title, genre, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [movie.title, movie.genre, movie.description]
      );
    }
    console.log('Movies seeded successfully!');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Seeding failed:', error.message);
    } else {
      console.error('Seeding failed:', error);
    }
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  seedMovies()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedMovies };