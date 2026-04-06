import { Injectable, Logger } from '@nestjs/common';
import { ClipsApi, Configuration, type SaveClipResponseDto } from '../midi-store-client';

@Injectable()
export class MidiStoreClient {
  readonly #logger = new Logger(MidiStoreClient.name);
  readonly #api: ClipsApi;

  constructor() {
    const basePath = (process.env['MIDI_STORE_URL'] ?? 'http://localhost:3001')
      .replace(/\/+$/, '');
    this.#api = new ClipsApi(new Configuration({ basePath }));
  }

  async saveClip(buffer: Buffer): Promise<SaveClipResponseDto> {
    this.#logger.log(`POST /clips — ${buffer.length} bytes`);
    const file = new Blob([new Uint8Array(buffer)], { type: 'audio/midi' });
    return this.#api.clipsControllerSave({ file });
  }
}
