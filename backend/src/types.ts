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
