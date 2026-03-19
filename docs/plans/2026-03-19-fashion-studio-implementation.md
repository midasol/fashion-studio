# Fashion Studio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a human fashion simulation web app that generates styled images and street fashion walking videos, based on the dd-fashion-studio-pro codebase with auth/DB removed and human-focused prompts.

**Architecture:** Frontend (React/Vite :3000) + Backend (Express/TypeScript :8000) with Google Gemini for image generation and Veo for video generation. No authentication, no database. Root package.json uses concurrently for single-command startup.

**Tech Stack:** Node.js, Express, TypeScript, React 18, Vite, @google/genai (latest), Zod, TailwindCSS, Lucide React

**Reference Project:** `/Users/sanggyulee/my-project/python-project/dd-fashion-studio-pro`

---

### Task 1: Root project setup

**Files:**
- Create: `package.json`
- Create: `.gitignore`

**Step 1: Create root package.json**

```json
{
  "name": "fashion-studio",
  "version": "1.0.0",
  "private": true,
  "description": "AI-powered human fashion simulation and street fashion video generator",
  "scripts": {
    "dev": "concurrently -n backend,frontend -c blue,green \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\"",
    "install:all": "npm install && npm install --prefix backend && npm install --prefix frontend",
    "build": "npm run build --prefix backend && npm run build --prefix frontend"
  },
  "devDependencies": {
    "concurrently": "^9.1.2"
  }
}
```

**Step 2: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

**Step 3: Initialize git and commit**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio
git init
npm install
git add package.json package-lock.json .gitignore docs/
git commit -m "chore: initialize project with root package.json and design docs"
```

---

### Task 2: Backend project scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`

**Step 1: Create backend/package.json**

```json
{
  "name": "fashion-studio-backend",
  "version": "1.0.0",
  "description": "Backend API for AI-powered human fashion simulation",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "express-rate-limit": "^7.4.1",
    "helmet": "^8.0.0",
    "morgan": "^1.10.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Note: Use `@google/genai` latest version - run `npm install @google/genai@latest` after creating to get the actual latest.

**Step 2: Create backend/tsconfig.json**

Copy from reference: `/Users/sanggyulee/my-project/python-project/dd-fashion-studio-pro/backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create backend/.env.example**

```
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

**Step 4: Install backend dependencies**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio/backend
npm install
npm install @google/genai@latest
```

**Step 5: Commit**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/.env.example
git commit -m "chore: scaffold backend with dependencies"
```

---

### Task 3: Backend config and types

**Files:**
- Create: `backend/src/config.ts`
- Create: `backend/src/types.ts`

**Step 1: Create backend/src/config.ts**

Based on reference `dd-fashion-studio-pro/backend/src/config.ts` but with model selection support (no hardcoded single model).

```typescript
import dotenv from 'dotenv';

dotenv.config();

export interface Settings {
  geminiApiKey: string;
  frontendUrl: string;
  host: string;
  port: number;
  debug: boolean;
  rateLimitRequests: number;
  rateLimitPeriod: number;
}

// Available models for user selection
export const IMAGE_MODELS = {
  'gemini-3.1-flash-image-preview': 'Nano Banana2 (Fast)',
  'gemini-3-pro-image-preview': 'Nano Banana Pro (High Quality)',
} as const;

export const VIDEO_MODELS = {
  'veo-3.1-fast-generate-preview': 'Veo 3.1 Fast',
  'veo-3.1-generate-preview': 'Veo 3.1 (High Quality)',
} as const;

export type ImageModelId = keyof typeof IMAGE_MODELS;
export type VideoModelId = keyof typeof VIDEO_MODELS;

export const DEFAULT_IMAGE_MODEL: ImageModelId = 'gemini-3-pro-image-preview';
export const DEFAULT_VIDEO_MODEL: VideoModelId = 'veo-3.1-fast-generate-preview';

export function getSettings(): Settings {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '8000', 10),
    debug: process.env.DEBUG?.toLowerCase() === 'true',
    rateLimitRequests: 10,
    rateLimitPeriod: 60 * 1000,
  };
}

let settingsInstance: Settings | null = null;

export function getCachedSettings(): Settings {
  if (!settingsInstance) {
    settingsInstance = getSettings();
  }
  return settingsInstance;
}
```

**Step 2: Create backend/src/types.ts**

Based on reference but with `model` field added to schemas, auth types removed.

```typescript
import { z } from 'zod';

export const ImageGenerationRequestSchema = z.object({
  imageBase64: z.string().min(1, 'Image is required'),
  prompt: z.string().default('high quality fashion photo'),
  referenceImageBase64: z.string().optional(),
  model: z.enum(['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview']).optional(),
}).strict();

export type ImageGenerationRequest = z.infer<typeof ImageGenerationRequestSchema>;

export interface ImageGenerationResponse {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
}

export const VideoGenerationRequestSchema = z.object({
  imageBase64: z.string().min(1, 'Image is required'),
  prompt: z.string().optional(),
  model: z.enum(['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview']).optional(),
});

export type VideoGenerationRequest = z.infer<typeof VideoGenerationRequestSchema>;

export interface VideoGenerationResponse {
  success: boolean;
  operationId?: string;
  error?: string;
}

export type VideoStatus = 'processing' | 'completed' | 'failed';

export interface VideoStatusResponse {
  status: VideoStatus;
  videoBase64?: string;
  mimeType?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
}

export interface RootResponse {
  message: string;
  version: string;
  docs: string;
  endpoints: {
    image_generation: string;
    video_generation: string;
    video_status: string;
  };
}

export interface ApiError {
  success: false;
  error: string;
}
```

**Step 3: Commit**

```bash
git add backend/src/
git commit -m "feat: add backend config with model selection and Zod types"
```

---

### Task 4: Backend Gemini service

**Files:**
- Create: `backend/src/services/gemini.ts`

**Step 1: Create backend/src/services/gemini.ts**

Based on reference `dd-fashion-studio-pro/backend/src/services/gemini.ts` with these changes:
- Prompt changed from doll to human fashion
- Model parameter accepted (not hardcoded)
- Video prompt changed from 360° to street walking
- Use `ai.operations.getVideosOperation()` instead of `ai.operations.get()` (latest SDK)

```typescript
import { GoogleGenAI, Modality } from '@google/genai';
import { getCachedSettings, DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL } from '../config.js';
import type { ImageModelId, VideoModelId } from '../config.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VideoOperationType = any;

const videoOperations: Map<string, VideoOperationType> = new Map();

export function stripBase64Prefix(base64String: string): string {
  if (base64String.includes(',')) {
    return base64String.split(',')[1] || base64String;
  }
  return base64String;
}

export function getMimeTypeFromBase64(base64String: string): string {
  const match = base64String.match(/data:([^;]+);base64,/);
  if (match && match[1]) {
    return match[1];
  }
  return 'image/png';
}

function getClient(): GoogleGenAI {
  const settings = getCachedSettings();
  return new GoogleGenAI({ apiKey: settings.geminiApiKey });
}

export async function generateFashionEdit(
  imageBase64: string,
  prompt: string,
  referenceImageBase64?: string,
  model?: ImageModelId
): Promise<{ imageBase64: string; mimeType: string }> {
  const client = getClient();
  const imageModel = model || DEFAULT_IMAGE_MODEL;

  const sourceData = stripBase64Prefix(imageBase64);
  const sourceMime = getMimeTypeFromBase64(imageBase64);

  const referenceNote = referenceImageBase64
    ? ' The user has also provided a reference image of the clothing/style they want. Match the clothing style, colors, and overall aesthetic from the reference image as closely as possible.'
    : '';

  const fullPrompt = `You are a professional fashion stylist and image editor. The user has provided their photo. Apply the requested fashion style to this person while preserving their face, body shape, and proportions. The result should look like a natural, realistic photo of the person wearing the described outfit. Maintain the original background or place them in a clean, neutral setting. Style: ${prompt}.${referenceNote}`;

  const contents: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [
    {
      inlineData: {
        mimeType: sourceMime,
        data: sourceData,
      },
    },
  ];

  if (referenceImageBase64) {
    const refData = stripBase64Prefix(referenceImageBase64);
    const refMime = getMimeTypeFromBase64(referenceImageBase64);
    contents.push({
      inlineData: {
        mimeType: refMime,
        data: refData,
      },
    });
  }

  contents.push({ text: fullPrompt });

  const response = await client.models.generateContent({
    model: imageModel,
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No fashion designs generated. Please check your prompt or image.');
  }

  const candidate = response.candidates[0];
  if (!candidate?.content?.parts) {
    throw new Error('No fashion designs generated. Please check your prompt or image.');
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/png';
      return {
        imageBase64: imageData || '',
        mimeType,
      };
    }
  }

  throw new Error('Failed to extract image from the fashion studio response.');
}

export async function generateFashionVideo(
  imageBase64: string,
  prompt: string,
  model?: VideoModelId
): Promise<string> {
  const settings = getCachedSettings();
  const client = getClient();
  const videoModel = model || DEFAULT_VIDEO_MODEL;

  const imageData = stripBase64Prefix(imageBase64);
  const imageMime = getMimeTypeFromBase64(imageBase64);

  const fullPrompt = `A person wearing ${prompt} walking naturally down a trendy urban street. Cinematic street fashion video style. Natural daylight, shallow depth of field. The person walks confidently toward the camera with a relaxed, natural gait. City atmosphere with blurred background.`;

  const operation = await client.models.generateVideos({
    model: videoModel,
    prompt: fullPrompt,
    image: {
      imageBytes: imageData,
      mimeType: imageMime,
    },
    config: {
      numberOfVideos: 1,
      aspectRatio: '9:16',
    },
  });

  if (!operation.name) {
    throw new Error('Failed to start video generation.');
  }

  const operationId = operation.name;
  videoOperations.set(operationId, operation);

  return operationId;
}

export async function getVideoStatus(
  operationId: string
): Promise<{
  status: 'processing' | 'completed' | 'failed';
  videoBase64?: string;
  mimeType?: string;
  error?: string;
}> {
  const settings = getCachedSettings();
  const client = getClient();

  try {
    const storedOperation = videoOperations.get(operationId);

    if (!storedOperation) {
      return {
        status: 'failed',
        error: 'Operation not found. It may have expired or completed already.',
      };
    }

    const operation = await client.operations.getVideosOperation({
      operation: storedOperation,
    });

    if (!operation.done) {
      return { status: 'processing' };
    }

    if (operation.error) {
      videoOperations.delete(operationId);
      return {
        status: 'failed',
        error: JSON.stringify(operation.error),
      };
    }

    const response = operation.response as {
      generatedVideos?: Array<{
        video?: {
          uri?: string;
        };
      }>;
    };

    if (
      response &&
      response.generatedVideos &&
      response.generatedVideos.length > 0
    ) {
      const video = response.generatedVideos[0];
      if (video?.video?.uri) {
        const videoUrl = new URL(video.video.uri);
        videoUrl.searchParams.set('key', settings.geminiApiKey);

        const fetchResponse = await fetch(videoUrl.toString());
        if (!fetchResponse.ok) {
          throw new Error(`Failed to download video: ${fetchResponse.statusText}`);
        }

        const videoBuffer = await fetchResponse.arrayBuffer();
        const videoBase64 = Buffer.from(videoBuffer).toString('base64');
        const mimeType = 'video/mp4';

        videoOperations.delete(operationId);

        return {
          status: 'completed',
          videoBase64,
          mimeType,
        };
      }
    }

    videoOperations.delete(operationId);
    return {
      status: 'failed',
      error: 'Video could not be produced.',
    };
  } catch (err) {
    console.error('getVideoStatus error:', err);
    videoOperations.delete(operationId);
    return {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/services/
git commit -m "feat: add Gemini service with human fashion prompts and model selection"
```

---

### Task 5: Backend routes

**Files:**
- Create: `backend/src/routes/image.ts`
- Create: `backend/src/routes/video.ts`

**Step 1: Create backend/src/routes/image.ts**

Based on reference but with `authMiddleware` removed and `model` parameter passed to service.

```typescript
import { Router, Request, Response } from 'express';
import { ImageGenerationRequestSchema, ImageGenerationResponse } from '../types.js';
import { generateFashionEdit } from '../services/gemini.js';
import { getCachedSettings } from '../config.js';

const settings = getCachedSettings();
const router = Router();

router.post('/generate-image', async (req: Request, res: Response<ImageGenerationResponse>) => {
  try {
    const parseResult = ImageGenerationRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      if (settings.debug) {
        console.error('Validation error details:', JSON.stringify(parseResult.error.format(), null, 2));
      }
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map(e => e.message).join(', '),
      });
      return;
    }

    const { imageBase64, prompt, referenceImageBase64, model } = parseResult.data;

    const result = await generateFashionEdit(imageBase64, prompt, referenceImageBase64, model);

    res.json({
      success: true,
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (err instanceof Error && err.message.includes('validation')) {
      if (settings.debug) {
        console.warn(`Image generation validation error: ${errorMessage}`);
      }
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
      return;
    }

    console.error(`Image generation error: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: `Failed to generate image: ${errorMessage}`,
    });
  }
});

export default router;
```

**Step 2: Create backend/src/routes/video.ts**

Based on reference but with `authMiddleware` removed and `model` parameter.

```typescript
import { Router, Request, Response } from 'express';
import { VideoGenerationRequestSchema, VideoGenerationResponse, VideoStatusResponse } from '../types.js';
import { generateFashionVideo, getVideoStatus } from '../services/gemini.js';
import { getCachedSettings } from '../config.js';

const settings = getCachedSettings();
const router = Router();

router.post('/generate-video', async (req: Request, res: Response<VideoGenerationResponse>) => {
  try {
    const parseResult = VideoGenerationRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      if (settings.debug) {
        console.error('[Video API] Validation failed:', parseResult.error.format());
      }
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e: { message: string }) => e.message).join(', '),
      });
      return;
    }

    const { imageBase64, prompt, model } = parseResult.data;

    const finalPrompt = prompt || 'high quality street fashion, cinematic lighting, 4k';

    const operationId = await generateFashionVideo(imageBase64, finalPrompt, model);

    res.status(202).json({
      success: true,
      operationId,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (err instanceof Error && err.message.includes('validation')) {
      if (settings.debug) {
        console.warn(`Video generation validation error: ${errorMessage}`);
      }
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
      return;
    }

    console.error(`Video generation error: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: `Failed to start video generation: ${errorMessage}`,
    });
  }
});

router.get('/video-status/*', async (req: Request, res: Response<VideoStatusResponse>) => {
  try {
    const operationId = req.params[0];

    if (!operationId) {
      res.status(400).json({
        status: 'failed',
        error: 'Operation ID is required',
      });
      return;
    }

    const validOperationPattern = /^[a-zA-Z0-9\-_\/\.]+$/;
    if (!validOperationPattern.test(operationId) || operationId.includes('..')) {
      res.status(400).json({
        status: 'failed',
        error: 'Invalid operation ID format',
      });
      return;
    }

    const result = await getVideoStatus(operationId);

    if (result.status === 'processing') {
      res.json({ status: 'processing' });
    } else if (result.status === 'completed') {
      res.json({
        status: 'completed',
        videoBase64: result.videoBase64,
        mimeType: result.mimeType,
      });
    } else {
      res.json({
        status: 'failed',
        error: result.error,
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Video status check error: ${errorMessage}`);
    res.status(500).json({
      status: 'failed',
      error: `Failed to check video status: ${errorMessage}`,
    });
  }
});

export default router;
```

**Step 3: Commit**

```bash
git add backend/src/routes/
git commit -m "feat: add image and video routes without auth middleware"
```

---

### Task 6: Backend server entry point

**Files:**
- Create: `backend/src/index.ts`

**Step 1: Create backend/src/index.ts**

Based on reference but with Firebase Admin, Prisma, and auth router removed.

```typescript
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
```

**Step 2: Test backend starts**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio/backend
cp .env.example .env
# Edit .env to add GEMINI_API_KEY if available
npx tsx src/index.ts
# Expected: "Server running at http://0.0.0.0:8000"
# Ctrl+C to stop
```

**Step 3: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: add backend server entry point without auth/DB"
```

---

### Task 7: Frontend project scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/.env.example`
- Create: `frontend/index.css`

**Step 1: Create frontend/package.json**

Based on reference but without firebase dependency.

```json
{
  "name": "fashion-studio-frontend",
  "version": "1.0.0",
  "description": "Frontend for AI-powered human fashion simulation",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "lucide-react": "^0.469.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}
```

**Step 2: Create frontend/tsconfig.json**

Copy from reference: same as dd-fashion-studio-pro/frontend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node", "vite/client"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] },
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create frontend/vite.config.ts**

Based on reference but without Firebase defines.

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8000'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
```

**Step 4: Create frontend/index.html**

Based on reference but without importmap (we use npm packages via Vite).

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fashion Studio - AI Street Fashion Simulator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
    </style>
    <link rel="stylesheet" href="/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

**Step 5: Create frontend/.env.example**

```
VITE_API_URL=http://localhost:8000
```

**Step 6: Create frontend/index.css**

```css
/* Custom animations */
@keyframes bounce-short {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce-short {
  animation: bounce-short 2s ease-in-out infinite;
}
```

**Step 7: Install frontend dependencies**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio/frontend
npm install
```

**Step 8: Commit**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio
git add frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/vite.config.ts frontend/index.html frontend/.env.example frontend/index.css
git commit -m "chore: scaffold frontend with Vite, React, TailwindCSS"
```

---

### Task 8: Frontend utilities and types

**Files:**
- Create: `frontend/src/types.ts`
- Create: `frontend/src/utils/imageUtils.ts`

**Step 1: Create frontend/src/types.ts**

Simplified from reference - remove AIStudio global, add model types.

```typescript
export interface GeneratedImage {
  data: string;
  mimeType: string;
}

export type ImageModelId = 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview';
export type VideoModelId = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';

export const IMAGE_MODELS: Record<ImageModelId, string> = {
  'gemini-3.1-flash-image-preview': 'Nano Banana2 (Fast)',
  'gemini-3-pro-image-preview': 'Nano Banana Pro (High Quality)',
};

export const VIDEO_MODELS: Record<VideoModelId, string> = {
  'veo-3.1-fast-generate-preview': 'Veo 3.1 Fast',
  'veo-3.1-generate-preview': 'Veo 3.1 (High Quality)',
};
```

**Step 2: Create frontend/src/utils/imageUtils.ts**

Copy from reference as-is.

```typescript
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const stripBase64Prefix = (base64String: string): string => {
  return base64String.replace(/^data:image\/[a-z]+;base64,/, '');
};

export const getMimeTypeFromBase64 = (base64String: string): string => {
  const match = base64String.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/png';
};
```

**Step 3: Commit**

```bash
git add frontend/src/
git commit -m "feat: add frontend types with model definitions and image utilities"
```

---

### Task 9: Frontend API service

**Files:**
- Create: `frontend/src/services/apiService.ts`

**Step 1: Create frontend/src/services/apiService.ts**

Based on reference but with auth token removed and model parameter added. Admin functions removed.

```typescript
import { stripBase64Prefix } from '../utils/imageUtils';
import type { ImageModelId, VideoModelId } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface VideoStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  videoBase64?: string;
  mimeType?: string;
  error?: string;
}

export const generateFashionEdit = async (
  imageBase64: string,
  prompt: string,
  referenceImagesBase64?: string[] | null,
  model?: ImageModelId
): Promise<string> => {
  const referenceImageBase64 = referenceImagesBase64 && referenceImagesBase64.length > 0
    ? stripBase64Prefix(referenceImagesBase64[0])
    : undefined;

  const response = await fetch(`${API_BASE_URL}/api/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: stripBase64Prefix(imageBase64),
      prompt,
      referenceImageBase64,
      model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Image generation failed');
  }

  return `data:${data.mimeType};base64,${data.imageBase64}`;
};

export const generateFashionVideo = async (
  imageBase64: string,
  prompt?: string,
  model?: VideoModelId
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: stripBase64Prefix(imageBase64),
      prompt: prompt || 'street fashion showcase',
      model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Video generation failed to start');
  }

  return data.operationId;
};

export const checkVideoStatus = async (
  operationId: string
): Promise<VideoStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/video-status/${operationId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const pollVideoUntilComplete = async (
  operationId: string,
  onStatusUpdate?: (status: VideoStatusResponse) => void,
  pollInterval: number = 10000,
  maxAttempts: number = 30
): Promise<string> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await checkVideoStatus(operationId);

    if (onStatusUpdate) {
      onStatusUpdate(status);
    }

    if (status.status === 'completed' && status.videoBase64) {
      const binaryString = atob(status.videoBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: status.mimeType || 'video/mp4' });
      return URL.createObjectURL(blob);
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Video generation failed');
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error('Video generation timed out');
};
```

**Step 2: Commit**

```bash
git add frontend/src/services/
git commit -m "feat: add API service without auth tokens, with model selection"
```

---

### Task 10: Frontend components - Header, ImageUpload, StyleInput

**Files:**
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/ImageUpload.tsx`
- Create: `frontend/src/components/StyleInput.tsx`

**Step 1: Create frontend/src/components/Header.tsx**

Simplified from reference - remove all auth UI.

```typescript
import React from 'react';
import { Sparkles, Shirt } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-pink-500 p-2 rounded-lg text-white">
            <Shirt size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Fashion Studio
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <Sparkles size={16} className="text-yellow-500" />
          <span>Powered by Gemini AI</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
```

**Step 2: Create frontend/src/components/ImageUpload.tsx**

Copy from reference as-is (it has no auth dependencies). Path: reuse `dd-fashion-studio-pro/frontend/components/ImageUpload.tsx` exactly, only changing import path for imageUtils.

The import should be `from '../utils/imageUtils'` (same as reference).

**Step 3: Create frontend/src/components/StyleInput.tsx**

Based on reference `PromptControls.tsx` but renamed. Keep the same functionality.

```typescript
import React, { useState } from 'react';
import { Wand2, ChevronDown, ChevronUp } from 'lucide-react';

interface StyleInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

const StyleInput: React.FC<StyleInputProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  disabled,
}) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors cursor-pointer"
      >
        <span>Style Description</span>
        {isDescriptionOpen ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {isDescriptionOpen && (
        <div className="group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the outfit, color, material, and accessories..."
            className="w-full min-h-[120px] p-5 rounded-3xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all resize-none shadow-inner"
          />
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        className={`w-full px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
          disabled || isGenerating
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-slate-900 text-white hover:bg-pink-600 hover:-translate-y-1 active:translate-y-0 active:scale-95'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 size={16} />
            Apply Style
          </>
        )}
      </button>
    </div>
  );
};

export default StyleInput;
```

**Step 4: Commit**

```bash
git add frontend/src/components/Header.tsx frontend/src/components/ImageUpload.tsx frontend/src/components/StyleInput.tsx
git commit -m "feat: add Header, ImageUpload, and StyleInput components"
```

---

### Task 11: Frontend component - ModelSelector (new)

**Files:**
- Create: `frontend/src/components/ModelSelector.tsx`

**Step 1: Create frontend/src/components/ModelSelector.tsx**

New component for selecting image and video models.

```typescript
import React from 'react';
import { Cpu } from 'lucide-react';
import { IMAGE_MODELS, VIDEO_MODELS } from '../types';
import type { ImageModelId, VideoModelId } from '../types';

interface ModelSelectorProps {
  imageModel: ImageModelId;
  videoModel: VideoModelId;
  onImageModelChange: (model: ImageModelId) => void;
  onVideoModelChange: (model: VideoModelId) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  imageModel,
  videoModel,
  onImageModelChange,
  onVideoModelChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <Cpu size={14} />
        <span>AI Models</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Image Model</label>
          <select
            value={imageModel}
            onChange={(e) => onImageModelChange(e.target.value as ImageModelId)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all"
          >
            {Object.entries(IMAGE_MODELS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Video Model</label>
          <select
            value={videoModel}
            onChange={(e) => onVideoModelChange(e.target.value as VideoModelId)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          >
            {Object.entries(VIDEO_MODELS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
```

**Step 2: Commit**

```bash
git add frontend/src/components/ModelSelector.tsx
git commit -m "feat: add ModelSelector component for image/video model selection"
```

---

### Task 12: Frontend component - ResultView

**Files:**
- Create: `frontend/src/components/ResultView.tsx`

**Step 1: Create frontend/src/components/ResultView.tsx**

Based on reference but change "360° View" to "Street Video", "dd-fashion" to "fashion-studio" in download filenames, and update text labels.

Copy the full component from reference (`dd-fashion-studio-pro/frontend/components/ResultView.tsx`) with these text changes:
- Tab label: `360° View` → `Street Video`
- Button text: `Create 360° Video` → `Create Street Video`
- Loading text: `Generating 360° Video` → `Generating Street Video`
- Description: `rotating 360-degree view` → `street fashion walking video`
- Label: `AI Generated 360° Preview` → `AI Generated Street Fashion`
- Download filenames: `dd-fashion-*` → `fashion-studio-*`

**Step 2: Commit**

```bash
git add frontend/src/components/ResultView.tsx
git commit -m "feat: add ResultView with street video labels and download buttons"
```

---

### Task 13: Frontend App.tsx and index.tsx

**Files:**
- Create: `frontend/src/index.tsx`
- Create: `frontend/src/App.tsx`

**Step 1: Create frontend/src/index.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 2: Create frontend/src/App.tsx**

Based on reference but with all auth removed, ModelSelector added, model state managed.

```typescript
import React, { useState } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import StyleInput from './components/StyleInput';
import ModelSelector from './components/ModelSelector';
import ResultView from './components/ResultView';
import {
  generateFashionEdit,
  generateFashionVideo,
  pollVideoUntilComplete,
} from './services/apiService';
import { AlertCircle, Camera, Sparkles } from 'lucide-react';
import type { ImageModelId, VideoModelId } from './types';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [appliedPrompt, setAppliedPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState<ImageModelId>('gemini-3-pro-image-preview');
  const [videoModel, setVideoModel] = useState<VideoModelId>('veo-3.1-fast-generate-preview');

  const handleImageSelect = (base64: string) => {
    setOriginalImage(base64);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setError(null);
  };

  const handleReferenceImagesSelect = (images: string[]) => {
    setReferenceImages(images);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    setGeneratedVideo(null);

    try {
      const result = await generateFashionEdit(originalImage, prompt, referenceImages, imageModel);
      setGeneratedImage(result);
      setAppliedPrompt(prompt);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Style design failed. Please try again.';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    const promptToUse = appliedPrompt || prompt;
    const finalPrompt = promptToUse || 'high quality street fashion, cinematic lighting, 4k';

    if (!generatedImage) return;

    setVideoLoading(true);
    setVideoError(null);

    try {
      const operationId = await generateFashionVideo(generatedImage, finalPrompt, videoModel);
      const videoUrl = await pollVideoUntilComplete(operationId, undefined, 10000, 30);
      setGeneratedVideo(videoUrl);
      setVideoError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Video production failed.';
      setVideoError(errorMessage);
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffafa] font-sans selection:bg-pink-100 selection:text-pink-600">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold uppercase tracking-widest mb-4 border border-pink-100">
            <Sparkles size={12} />
            AI Street Fashion
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Fashion <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Studio</span>
          </h2>
          <p className="text-slate-500 text-lg sm:text-xl leading-relaxed">
            Try on any style and see yourself walking the streets with AI-powered fashion simulation.
          </p>
        </div>

        {error && (
          <div className="mb-8 max-w-2xl mx-auto bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm animate-bounce-short">
            <AlertCircle size={24} className="flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-pink-100/20 border border-pink-50 transition-all hover:shadow-2xl hover:shadow-pink-100/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Canvas</h3>
                <Camera size={18} className="text-slate-300" />
              </div>
              <div className="space-y-6">
                <div className="h-72">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    currentImage={originalImage}
                    label="Your Photo"
                    subLabel="Upload your full-body photo"
                  />
                </div>
                <div className="h-72">
                  <ImageUpload
                    onImagesSelect={handleReferenceImagesSelect}
                    currentImages={referenceImages}
                    multiple={true}
                    maxImages={5}
                    label="Style Reference"
                    subLabel="Optional clothing references (max 5)"
                  />
                </div>
              </div>

              {/* Model Selector */}
              <div className="mt-6">
                <ModelSelector
                  imageModel={imageModel}
                  videoModel={videoModel}
                  onImageModelChange={setImageModel}
                  onVideoModelChange={setVideoModel}
                />
              </div>

              {/* Style Input and Generate Button */}
              <div className="mt-6">
                <StyleInput
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onGenerate={handleGenerate}
                  isGenerating={loading}
                  disabled={!originalImage}
                />
              </div>
            </section>
          </div>

          <div className="lg:col-span-7 h-full">
            <section className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 h-full min-h-[700px] flex flex-col sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Showcase</h3>
                <div className="flex gap-2">
                  {generatedImage && <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
                  {generatedVideo && <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />}
                </div>
              </div>
              <div className="flex-grow flex flex-col">
                <ResultView
                  originalImage={originalImage}
                  generatedImage={generatedImage}
                  generatedVideo={generatedVideo}
                  onGenerateVideo={handleGenerateVideo}
                  isVideoGenerating={videoLoading}
                  videoError={videoError}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
```

**Step 3: Test frontend starts**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio/frontend
npx vite
# Expected: Vite dev server starts on http://localhost:3000
# Ctrl+C to stop
```

**Step 4: Commit**

```bash
git add frontend/src/index.tsx frontend/src/App.tsx
git commit -m "feat: add App component with model selection, no auth"
```

---

### Task 14: End-to-end test

**Step 1: Install all dependencies from root**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio
npm run install:all
```

**Step 2: Set up backend .env**

```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

**Step 3: Start both servers**

```bash
cd /Users/sanggyulee/my-project/python-project/fashion-studio
npm run dev
```

Expected:
- Backend: `Server running at http://0.0.0.0:8000`
- Frontend: `Vite dev server running at http://localhost:3000`

**Step 4: Verify health check**

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"Fashion Studio API","version":"1.0.0"}
```

**Step 5: Verify frontend loads**

Open `http://localhost:3000` in browser. Should see:
- Header with "Fashion Studio"
- Two image upload areas ("Your Photo" and "Style Reference")
- Model selector dropdowns
- Style description input
- Apply Style button (disabled until image uploaded)
- Empty showcase area

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Fashion Studio app - human fashion simulation with street video"
```
