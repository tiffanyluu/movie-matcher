import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const setupDatabase = async () => {
  const defaultPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'tiffanyluu',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DEFAULT_DB || 'tiffanyluu'
  });

  let appPool: Pool | null = null;

  try {
    console.log('Setting up database and tables...');

    console.log('Creating database moviematcher...');
    try {
      await defaultPool.query('CREATE DATABASE moviematcher;');
      console.log('Database created!');
    } catch (error: any) {
      if (error.code === '42P04') {
        console.log('Database already exists, continuing...');
      } else {
        throw error;
      }
    }

    await defaultPool.end();

    appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'tiffanyluu',
      password: process.env.DB_PASSWORD || '',
      database: 'moviematcher'
    });

    console.log('Creating tables...');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await appPool.query(`
        CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        movie_id INT REFERENCES movies(id),
        rating INT CHECK (rating = 0 OR rating = 1),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
  

    console.log('Creating indexes for performance...');
    await appPool.query(`CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);`);
    await appPool.query(`CREATE INDEX IF NOT EXISTS idx_ratings_movie ON ratings(movie_id);`);

    console.log('Database setup complete!');
    console.log('Tables created:');
    console.log('   - users');
    console.log('   - movies');
    console.log('   - ratings');
    console.log('Ready to run: npm run seed-movies');

  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    if (appPool) {
      await appPool.end();
    }
  }
};

// Run if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase };
