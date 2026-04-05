import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface SaveClipResponse {
  key: string;
  downloadUrl: string;
  ttlSeconds: number;
}

/**
 * Mock implementation — stores nothing, returns a plausible key + URL.
 * Swap this out for an HttpMidiStoreClient once scribbletune-midi-store is running.
 */
@Injectable()
export class MidiStoreClient {
  private readonly logger = new Logger(MidiStoreClient.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async saveClip(buffer: Buffer): Promise<SaveClipResponse> {
    const key = `clips:${randomUUID()}`;
    const baseUrl = process.env['MIDI_STORE_URL'] ?? 'http://localhost:3001';
    const downloadUrl = `${baseUrl}/clips/${key}`;

    this.logger.warn(
      `[MOCK] MidiStoreClient.saveClip — buffer ${buffer.length} bytes not persisted. key=${key}`,
    );

    return { key, downloadUrl, ttlSeconds: 3600 };
  }
}
