import express, { Request, Response } from 'express';
import { authenticateToken } from './usersRoutes';
import { generateRecommendations } from '../services/recommendationService';

const router = express.Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 5;
    
    if (limit < 1 || limit > 50) {
      return res.status(400).json({ 
        error: 'Limit must be between 1 and 50' 
      });
    }

    const recommendations = await generateRecommendations(userId, limit);
    
    res.json({
      recommendations,
      userId,
      limit,
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
});

export default router;