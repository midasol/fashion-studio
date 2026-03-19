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
