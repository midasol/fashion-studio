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
