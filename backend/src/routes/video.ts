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
