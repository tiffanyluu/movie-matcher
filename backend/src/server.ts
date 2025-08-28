import dotenv from 'dotenv';
dotenv.config();
import express, {Application, Request, Response, NextFunction} from 'express';
import cors from 'cors';
import { initializeRedis, closeRedis } from './db/redis';

import usersRouter from './routes/usersRoutes';
import moviesRouter from './routes/moviesRoutes';
import ratingsRouter from './routes/ratingsRoutes';

const app: Application = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/users', usersRouter);
app.use('/movies', moviesRouter);
app.use('/ratings', ratingsRouter);

app.get('/health', (_req: Request, res: Response) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
});


app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ 
      error: 'Endpoint not found',
      path: req.originalUrl 
    });
});

const startServer = async () => {
  try {
    await initializeRedis();
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    })
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeRedis();
  process.exit(0);
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeRedis();
  process.exit(0);
});

if (require.main === module || process.env.PLAYWRIGHT) {
  startServer();
}

export default app;