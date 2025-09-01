import pool from "./index";

export const setupDatabase = async () => {
  try {
    console.log("Creating tables...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) UNIQUE NOT NULL,
        genre VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        movie_id INT REFERENCES movies(id),
        rating INT CHECK (rating IN (0, 1)),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, movie_id)
      );
    `);

    console.log("Creating indexes...");
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);`
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_ratings_movie ON ratings(movie_id);`
    );

    console.log("✅ Database setup complete!");
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  }
};

if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log("Setup finished successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
