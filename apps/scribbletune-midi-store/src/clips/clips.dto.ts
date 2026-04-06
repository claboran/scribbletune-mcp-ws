import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SaveClipResponseSchema = z.object({
  key: z.string().describe('Unique clip key, e.g. clips:<uuid>'),
  downloadUrl: z.string().describe('Full URL to download the MIDI file'),
  ttlSeconds: z.number().int().describe('Seconds until the clip expires'),
});

export class SaveClipResponseDto extends createZodDto(SaveClipResponseSchema) {}
