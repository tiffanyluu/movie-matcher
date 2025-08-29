import express, {Request, Response} from 'express';
import pool from '../db';
import {authenticateToken} from './usersRoutes';
import { RateMovieRequest, RatingResponse } from '../types';
import { invalidateUserCache } from '../services/recommendationService';

const router = express.Router();

router.post('/', authenticateToken, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const {movieId, rating}: RateMovieRequest = req.body;

    if (movieId === undefined || rating === undefined) {
        return res.status(400).json({error: "Movie and rating are required"})
    }
    if (![0,1].includes(rating)) {
        return res.status(400).json({error: "Rating must be 0 or 1"})
    }

    try {
        await pool.query(
            `INSERT INTO ratings (user_id, movie_id, rating, timestamp)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = $3, timestamp = NOW()`,
            [userId, movieId, rating]
        )
        await invalidateUserCache(userId);
        res.json({success: true})
    } catch (err: unknown) {
      console.error('Rate movie error:', err);
      res.status(500).json({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
});

router.get('/', authenticateToken, async (req: Request, res: Response<RatingResponse[]>) => {
    const userId = (req as any).user.userId;
    
    try {
      const result = await pool.query(
        'SELECT movie_id, rating FROM ratings WHERE user_id = $1 ORDER BY timestamp DESC',
        [userId]
      );
      
      const ratings = result.rows as RatingResponse[];
      res.json(ratings);
    } catch (err: unknown) {
      console.error('Get user ratings error:', err);
      res.status(500).json({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      } as any);
    }
  });
  
  export default router;