import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ScribbletunService } from '../../scribbletune/scribbletune.service';

const ProgressionSchema = z.object({
  root: z.string().describe('Root note with octave, e.g. "C4", "G#3"'),
  mode: z
    .enum([
      'major', 'minor', 'dorian', 'phrygian', 'lydian',
      'mixolydian', 'locrian', 'harmonic minor', 'melodic minor',
    ])
    .describe('Scale/mode to derive chords from'),
  degrees: z
    .string()
    .optional()
    .describe(
      'Space-separated chord degrees, e.g. "I IV V ii". If omitted a musically sensible random progression is generated.',
    ),
  count: z
    .number()
    .int()
    .min(2)
    .max(8)
    .default(4)
    .describe('Number of chords when generating randomly'),
});

@Injectable()
export class ProgressionTool {
  constructor(private readonly scribbletun: ScribbletunService) {}

  @Tool({
    name: 'get-progression',
    description:
      'Resolve chord scale degrees to actual chord names for a given root and mode. ' +
      'Only useful before generate-clip with command=chord or command=arp. ' +
      'Not needed for basslines or melodic riffs (command=riff).',
    parameters: ProgressionSchema,
  })
  getProgression(params: z.infer<typeof ProgressionSchema>) {
    const { degrees, chordNames } = this.scribbletun.resolveProgression(
      params.root,
      params.mode,
      params.degrees,
      params.count,
    );

    return {
      degrees,
      chordNames,
      hint: 'Pass chordNames as the "progression" parameter of generate-clip with command=chord or command=arp.',
    };
  }
}
