import pool from './index';
import bcrypt from 'bcrypt';

const addTestData = async () => {
  console.log('Adding test users and ratings...');

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const testUsers = [
      { name: 'Alice Johnson', email: 'alice@test.com' },
      { name: 'Bob Smith', email: 'bob@test.com' },
      { name: 'Carol Davis', email: 'carol@test.com' },
    ];

    const userIds = [];
    for (const user of testUsers) {
      const result = await pool.query(
        `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
        `,
        [user.name, user.email, hashedPassword]
      );

      if (result.rows.length > 0) {
        userIds.push(result.rows[0].id);
        console.log(`Created user: ${user.name} (ID: ${result.rows[0].id})`);
      } else {
        // User already exists, fetch their ID
        const existing = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );
        userIds.push(existing.rows[0].id);
        console.log(`User already exists: ${user.name} (ID: ${existing.rows[0].id})`);
      }
    }

    const testRatings = [
      // Alice likes movies 1, 2, 5 and dislikes 3, 4
      { userId: userIds[0], movieId: 1, rating: 1 },
      { userId: userIds[0], movieId: 2, rating: 1 },
      { userId: userIds[0], movieId: 5, rating: 1 },
      { userId: userIds[0], movieId: 3, rating: 0 },
      { userId: userIds[0], movieId: 4, rating: 0 },

      // Bob likes movies 1, 3, 6 and dislikes 2, 7
      { userId: userIds[1], movieId: 1, rating: 1 },
      { userId: userIds[1], movieId: 3, rating: 1 },
      { userId: userIds[1], movieId: 6, rating: 1 },
      { userId: userIds[1], movieId: 2, rating: 0 },
      { userId: userIds[1], movieId: 7, rating: 0 },

      // Carol likes movies 2, 4, 8 and dislikes 1, 5
      { userId: userIds[2], movieId: 2, rating: 1 },
      { userId: userIds[2], movieId: 4, rating: 1 },
      { userId: userIds[2], movieId: 8, rating: 1 },
      { userId: userIds[2], movieId: 1, rating: 0 },
      { userId: userIds[2], movieId: 5, rating: 0 },
    ];

    for (const rating of testRatings) {
      await pool.query(
        `
        INSERT INTO ratings (user_id, movie_id, rating, timestamp)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, movie_id) DO NOTHING
        `,
        [rating.userId, rating.movieId, rating.rating]
      );
    }

    console.log(`Added ${testRatings.length} test ratings`);
    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  addTestData();
}
