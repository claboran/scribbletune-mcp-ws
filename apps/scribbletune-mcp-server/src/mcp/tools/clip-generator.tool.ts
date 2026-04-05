import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { MidiStoreClient } from '../../midi-store/midi-store.client';
import { ScribbletunService } from '../../scribbletune/scribbletune.service';

const ClipSchema = z.object({
  command: z
    .enum(['riff', 'chord', 'arp'])
    .describe(
      'riff=melodic line / bassline from scale; chord=block chord progression; arp=arpeggiated chords',
    ),
  root: z.string().describe('Root note with octave, e.g. "G#3"'),
  mode: z
    .string()
    .describe(
      'Scale name exactly as listed in scribbletune://docs/scales, e.g. "minor", "dorian", "phrygian"',
    ),
  pattern: z
    .string()
    .describe(
      'Rhythm pattern: x=hit, -=rest, _=sustain, R=random. E.g. "x-x--x-x". See scribbletune://docs/notes-and-patterns.',
    ),
  subdiv: z
    .string()
    .default('8n')
    .describe('Note duration per step: "16n" "8n" "4n" "2n" "1n" "1m"'),
  progression: z
    .string()
    .optional()
    .describe(
      'Required for command=chord or command=arp. Chord names ("CM FM GM") or resolved degrees from get-progression tool.',
    ),
  bpm: z.number().int().min(20).max(300).describe('Tempo in BPM'),
  amp: z.number().min(0).max(127).optional().describe('Max velocity 0–127'),
  sizzle: z
    .enum(['sin', 'cos', 'rampUp', 'rampDown'])
    .optional()
    .describe('Velocity envelope shape over the pattern'),
  sizzleReps: z.number().int().positive().optional(),
  accent: z.string().optional().describe('Accent pattern, e.g. "x--x"'),
  accentLow: z.number().int().min(0).max(127).optional(),
  arpCount: z.number().int().min(2).max(8).optional().describe('Notes per chord for arp command (default 4)'),
  arpOrder: z.string().optional().describe('Arp note order as digit string, e.g. "0123" ascending, "3210" descending'),
});

@Injectable()
export class ClipGeneratorTool {
  private readonly logger = new Logger(ClipGeneratorTool.name);

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
    this.logger.log(
      `generate-clip: command=${params.command} root=${params.root} mode=${params.mode} bpm=${params.bpm}`,
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
