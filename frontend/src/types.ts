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
