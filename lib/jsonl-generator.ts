import { readFile } from 'fs/promises';
import { join } from 'path';

export interface ImageData {
  id: string;
  filename: string;
  annotation: string;
  filePath: string;
  mimeType: string;
}

export interface TrainingExample {
  messages: Array<{
    role: 'user' | 'assistant';
    content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
}

export async function generateJSONL(images: ImageData[]): Promise<string> {
  const examples: TrainingExample[] = [];

  for (const image of images) {
    try {
      // Read the image file and convert to base64
      const imageBuffer = await readFile(image.filePath);
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${image.mimeType};base64,${base64Image}`;

      const example: TrainingExample = {
        messages: [
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
      // Skip this image if there's an error
    }
  }

  // Convert to JSONL format (one JSON object per line)
  return examples.map((example) => JSON.stringify(example)).join('\n');
}

export function validateJSONL(jsonl: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = jsonl.trim().split('\n');

  if (lines.length === 0) {
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
