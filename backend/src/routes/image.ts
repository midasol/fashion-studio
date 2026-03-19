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

    console.error('Image generation error:', err instanceof Error ? err : errorMessage);
    res.status(500).json({
      success: false,
      error: `Failed to generate image: ${errorMessage}`,
    });
  }
});

export default router;
