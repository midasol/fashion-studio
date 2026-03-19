import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { getCachedSettings } from './config.js';
import imageRouter from './routes/image.js';
import videoRouter from './routes/video.js';
import type { HealthCheckResponse, RootResponse, ApiError } from './types.js';

const settings = getCachedSettings();
const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan(settings.debug ? 'dev' : 'combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const corsOrigins = [
  settings.frontendUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400,
  })
);

const apiLimiter = rateLimit({
  windowMs: settings.rateLimitPeriod,
  max: settings.rateLimitRequests,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

app.get('/health', (_req: Request, res: Response<HealthCheckResponse>) => {
  res.json({
    status: 'healthy',
    service: 'Fashion Studio API',
    version: '1.0.0',
  });
});

app.get('/', (_req: Request, res: Response<RootResponse>) => {
  res.json({
    message: 'Fashion Studio API',
    version: '1.0.0',
    docs: settings.debug ? '/docs' : 'Disabled in production',
    endpoints: {
      image_generation: '/api/generate-image',
      video_generation: '/api/generate-video',
      video_status: '/api/video-status/{operation_id}',
    },
  });
});

app.use('/api', imageRouter);
app.use('/api', videoRouter);

app.use((err: Error, _req: Request, res: Response<ApiError>, _next: NextFunction) => {
  console.error(`Unhandled exception: ${err.message}`, err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again later.',
  });
});

app.use((_req: Request, res: Response<ApiError>) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

const debugLog = (...args: unknown[]) => {
  if (settings.debug) {
    console.log(...args);
  }
};

const startServer = async () => {
  debugLog('Starting Fashion Studio Backend...');

  if (!settings.geminiApiKey) {
    console.warn('GEMINI_API_KEY is not set! API calls will fail.');
  } else {
    debugLog('Gemini API key configured');
  }

  app.listen(settings.port, settings.host, () => {
    debugLog(`Server running at http://${settings.host}:${settings.port}`);
  });
};

process.on('SIGTERM', () => {
  debugLog('Shutting down Fashion Studio Backend...');
  process.exit(0);
});

process.on('SIGINT', () => {
  debugLog('Shutting down Fashion Studio Backend...');
  process.exit(0);
});

startServer();

export default app;
