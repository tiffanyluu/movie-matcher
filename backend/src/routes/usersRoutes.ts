import express, {Request, Response, NextFunction} from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { SignupRequest, LoginRequest, UserPayload, UserRow } from '../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SALT_ROUNDS = 10;

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({error: "Access token required."})
    }
    jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, user: any) => {
        if (err) {
            return res.status(403).json({error: "Invalid token"})
        }
        (req as any).user = user as UserPayload;
        next();
    })
}

router.post('/signup', async (req: Request<{}, {}, SignupRequest>, res: Response) => {
    const {name, email, password} = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({error: "All fields required."})
    }
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (existing.rows.length > 0) {
            return res.status(409).json({error: "Email exists."})
        }
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email',
            [name, email, hashed]
        );

        const user = result.rows[0] as UserRow;
        const token = jwt.sign({userId: user.id}, JWT_SECRET, {expiresIn: '7d'});

        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        });
    } catch (err: unknown) {
        console.error('Signup error:', err);
        res.status(500).json({ 
        error: err instanceof Error ? err.message : 'Unknown error.' 
        });
    }
});

router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({error: 'Email and password required.'})
    }

    try {
        const result = await pool.query(
            'SELECT id, name, email, password_hash FROM users WHERE email = $1',
            [email]
        )
        if (result.rows.length === 0) {
            return res.status(401).json({error: 'Invalid email/password.'})
        }
        const user = result.rows[0] as UserRow;
        const match = await bcrypt.compare(password, user.password_hash)

        if (!match) {
            return res.status(401).json({error: "Invalid email/password."})
        }
        const token = jwt.sign({userId: user.id}, JWT_SECRET, {expiresIn: '7d'});

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        })
    } catch (err: unknown) {
        console.log('Login error:', err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Unknown error."
        })
    }
});

router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      
      const result = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [userId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const user = result.rows[0] as Omit<UserRow, 'password_hash'>;
      res.json({ user });
    } catch (err: unknown) {
      console.error('Profile error:', err);
      res.status(500).json({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
});

export default router;