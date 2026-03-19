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
