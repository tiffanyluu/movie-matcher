import express, {Request, Response} from 'express';
import pool from '../db';
import {MovieRow} from '../types';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT id, title, genre, description FROM movies ORDER BY id LIMIT 50'
        );
        const movies = result.rows as MovieRow[];
        res.json(movies)
    } catch (err: unknown) {
        console.log('Get movies error:', err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Unknown error."
        })
    }
})

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
      const movieId = parseInt(req.params.id);

      if (isNaN(movieId)) {
        return res.status(400).json({ error: 'Invalid movie ID' });
      }
      const result = await pool.query(
        'SELECT id, title, genre, description FROM movies WHERE id = $1',
        [movieId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      const movie = result.rows[0] as MovieRow;
      res.json(movie);
    } catch (err: unknown) {
      console.error('Get movie error:', err);
      res.status(500).json({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
});

export default router;