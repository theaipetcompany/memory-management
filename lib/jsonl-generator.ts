import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  validateImageBuffer,
  validateDatasetSize,
  validateTrainingExample,
  OPENAI_VISION_REQUIREMENTS,
} from './image-validation';

export interface ImageData {
  id: string;
  filename: string;
  annotation: string;
  filePath: string;
  mimeType: string;
}

export interface TrainingExample {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content:
      | string
      | Array<{
          type: 'text' | 'image_url';
          text?: string;
          image_url?: {
            url: string;
          };
        }>;
  }>;
}

export interface JSONLGenerationResult {
  jsonl: string;
  validExamples: number;
  skippedImages: Array<{
    filename: string;
    reason: string;
  }>;
  validationErrors: string[];
}

export async function generateJSONL(
  images: ImageData[]
): Promise<JSONLGenerationResult> {
  const examples: TrainingExample[] = [];
  const skippedImages: Array<{ filename: string; reason: string }> = [];
  const validationErrors: string[] = [];

  // Validate dataset size
  const datasetValidation = validateDatasetSize(
    images.length,
    OPENAI_VISION_REQUIREMENTS
  );
  if (!datasetValidation.isValid) {
    validationErrors.push(...datasetValidation.errors);
  }

  // Validate training example size (each example has 1 image in our current structure)
  const exampleValidation = validateTrainingExample(
    1,
    OPENAI_VISION_REQUIREMENTS
  );
  if (!exampleValidation.isValid) {
    validationErrors.push(...exampleValidation.errors);
  }

  for (const image of images) {
    try {
      // Read the image file
      const imageBuffer = await readFile(image.filePath);

      // Validate image against OpenAI vision requirements
      const validation = await validateImageBuffer(
        imageBuffer,
        OPENAI_VISION_REQUIREMENTS
      );

      if (!validation.isValid) {
        skippedImages.push({
          filename: image.filename,
          reason: validation.errors.join('; '),
        });
        continue;
      }

      // Convert to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${image.mimeType};base64,${base64Image}`;

      const example: TrainingExample = {
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that identifies uncommon cheeses.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
          {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: image.annotation,
              },
            ],
          },
        ],
      };

      examples.push(example);
    } catch (error) {
      console.error(`Error processing image ${image.filename}:`, error);
      skippedImages.push({
        filename: image.filename,
        reason: `Processing error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  }

  // Convert to JSONL format (one JSON object per line)
  const jsonl = examples.map((example) => JSON.stringify(example)).join('\n');

  return {
    jsonl,
    validExamples: examples.length,
    skippedImages,
    validationErrors,
  };
}

export function validateJSONL(jsonl: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = jsonl.trim().split('\n');

  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
    errors.push('JSONL file is empty');
    return { valid: false, errors };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parsed = JSON.parse(line);

      // Validate structure
      if (!parsed.messages || !Array.isArray(parsed.messages)) {
        errors.push(`Line ${i + 1}: Missing or invalid 'messages' array`);
        continue;
      }

      if (parsed.messages.length !== 2) {
        errors.push(
          `Line ${i + 1}: Expected exactly 2 messages (user and assistant)`
        );
        continue;
      }

      const [userMessage, assistantMessage] = parsed.messages;

      // Validate user message
      if (userMessage.role !== 'user') {
        errors.push(`Line ${i + 1}: First message must have role 'user'`);
      }

      if (!userMessage.content || !Array.isArray(userMessage.content)) {
        errors.push(`Line ${i + 1}: User message missing content array`);
        continue;
      }

      const imageContent = userMessage.content.find(
        (c: any) => c.type === 'image_url'
      );
      if (!imageContent) {
        errors.push(`Line ${i + 1}: User message missing image content`);
      }

      // Validate assistant message
      if (assistantMessage.role !== 'assistant') {
        errors.push(`Line ${i + 1}: Second message must have role 'assistant'`);
      }

      if (
        !assistantMessage.content ||
        !Array.isArray(assistantMessage.content)
      ) {
        errors.push(`Line ${i + 1}: Assistant message missing content array`);
        continue;
      }

      const textContent = assistantMessage.content.find(
        (c: any) => c.type === 'text'
      );
      if (!textContent || !textContent.text) {
        errors.push(`Line ${i + 1}: Assistant message missing text content`);
      }
    } catch (error) {
      errors.push(`Line ${i + 1}: Invalid JSON - ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
