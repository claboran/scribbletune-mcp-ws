import { Injectable, Logger } from '@nestjs/common';
import { arp, clip, getChordsByProgression, midi, progression, scale } from 'scribbletune';
import type { ClipParams as ScribbletunClipParams } from 'scribbletune';
import type { ClipParams } from './scribbletune.types';

@Injectable()
export class ScribbletunService {
  private readonly logger = new Logger(ScribbletunService.name);

  generateBuffer(params: ClipParams): { buffer: Buffer; eventCount: number } {
    const notes = this.resolveNotes(params);
    const clipParams: ScribbletunClipParams = {
      notes,
      pattern: params.pattern,
      subdiv: params.subdiv ?? '8n',
      sizzle: params.sizzle,
      sizzleReps: params.sizzleReps,
      amp: params.amp,
      accent: params.accent,
      accentLow: params.accentLow,
    };
    const noteEvents = clip(clipParams);

    // midi(notes, null, bpm) returns binary string when fileName is null
    const bytes = midi(noteEvents, null, params.bpm) as string;
    const buffer = Buffer.from(bytes, 'binary');

    this.logger.debug(`Generated ${noteEvents.length} events, ${buffer.length} bytes`);
    return { buffer, eventCount: noteEvents.length };
  }

  resolveProgression(root: string, mode: string, degrees?: string, count = 4): {
    degrees: string[];
    chordNames: string;
  } {
    let resolvedDegrees: string[];

    if (degrees) {
      resolvedDegrees = degrees.trim().split(/\s+/);
    } else {
      const scaleType = mode === 'minor' || mode === 'aeolian' ? 'm' : 'M';
      resolvedDegrees = progression(scaleType, count);
    }

    const chordNames = getChordsByProgression(`${root} ${mode}`, resolvedDegrees.join(' '));
    return { degrees: resolvedDegrees, chordNames };
  }

  private resolveNotes(params: ClipParams): string | string[] {
    const { command, root, mode, progression: prog } = params;

    if (command === 'riff') {
      return scale(`${root} ${mode}`);
    }

    if (!prog) {
      throw new Error(`"progression" is required for command="${command}"`);
    }

    const chords = getChordsByProgression(`${root} ${mode}`, prog);

    if (command === 'arp') {
      return arp({ chords, count: params.arpCount ?? 4, order: params.arpOrder });
    }

    return chords;
  }
}
