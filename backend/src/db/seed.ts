import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "./index";


export const seedMovies = async () => {
  const csvFilePath = path.join(__dirname, "sampled.csv");
  const movies: { title: string; genre: string; description: string }[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        movies.push({
          title: row.title,
          genre: row.genres,
          description: row.overview,
        });
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`Seeding ${movies.length} movies...`);

  const client = await pool.connect();
  try {
    for (const movie of movies) {
      await client.query(
        `INSERT INTO movies (title, genre, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (title) DO NOTHING`,
        [movie.title, movie.genre, movie.description]
      );
    }
    console.log("✅ Movies seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    client.release();
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
