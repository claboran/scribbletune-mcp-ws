import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { MidiStoreClient } from '../../midi-store/midi-store.client';
import { ScribbletunService } from '../../scribbletune/scribbletune.service';
import { ClipSchema } from '../../scribbletune/scribbletune.schema';

@Injectable()
export class ClipGeneratorTool {
  readonly #logger = new Logger(ClipGeneratorTool.name);

  constructor(
    private readonly scribbletun: ScribbletunService,
    private readonly midiStore: MidiStoreClient,
  ) {}

  @Tool({
    name: 'generate-clip',
    description:
      'Generate a MIDI clip from a musical description. Returns a key and download URL. ' +
      'Consult scribbletune://docs/overview before calling. ' +
      'For chord/arp commands consider calling get-progression first.',
    parameters: ClipSchema,
  })
  async generate(params: z.infer<typeof ClipSchema>) {
    this.#logger.log(
      `generate-clip: command=${params.command} root=${params.root ?? '(custom notes)'} mode=${params.mode ?? '(custom notes)'} bpm=${params.bpm}`,
    );

    const { buffer, eventCount } = this.scribbletun.generateBuffer(params);
    const stored = await this.midiStore.saveClip(buffer);

    return {
      key: stored.key,
      downloadUrl: stored.downloadUrl,
      ttlSeconds: stored.ttlSeconds,
      meta: {
        command: params.command,
        root: params.root,
        mode: params.mode,
        bpm: params.bpm,
        eventCount,
      },
    };
  }
}
