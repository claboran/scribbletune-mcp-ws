import { parseMidi, MidiEvent } from 'midi-file';
import { ClipSchema } from './scribbletune.schema';
import { ScribbletunService } from './scribbletune.service';
import type { ClipParams } from './scribbletune.types';

// ─── helpers ────────────────────────────────────────────────────────────────

function parse(buffer: Buffer) {
  return parseMidi(new Uint8Array(buffer));
}

function noteOns(midi: ReturnType<typeof parseMidi>): Extract<MidiEvent, { type: 'noteOn' }>[] {
  return midi.tracks
    .flat()
    .filter((e): e is Extract<MidiEvent, { type: 'noteOn' }> => e.type === 'noteOn' && e.velocity > 0);
}

function tempoEvent(midi: ReturnType<typeof parseMidi>) {
  return midi.tracks
    .flat()
    .find((e): e is Extract<MidiEvent, { type: 'setTempo' }> => e.type === 'setTempo');
}

function bpmToMicros(bpm: number) {
  return Math.round(60_000_000 / bpm);
}

function xCount(pattern: string) {
  return pattern.split('').filter((c) => c === 'x').length;
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('ScribbletunService', () => {
  let service: ScribbletunService;

  beforeEach(() => {
    service = new ScribbletunService();
  });

  // ── 1. README example — Deep Tech bassline ────────────────────────────────
  // Mirrors the documented example: 16 explicit pitches, 16n grid, sizzle
  // velocity envelope. D#2=39  F2=41  G2=43  G#2=44  A#2=46
  describe('README Deep Tech bassline (notes override, 16n, sizzle:sin)', () => {
    const params: ClipParams = {
      command: 'riff',
      notes: 'D#2 D#2 F2 D#2 F2 D#2 D#2 F2 G2 G#2 A#2 A#2 A#2 A#2 G#2 A#2',
      pattern: 'x--x-x--x---x--xx-x-xx-x-xx-x-xx',
      subdiv: '16n',
      bpm: 131,
      sizzle: 'sin',
      amp: 90,
      accentLow: 45,
    };
    const EXPECTED_PITCHES = new Set([39, 41, 43, 44, 46]);

    it('produces a non-empty buffer that is parseable as MIDI', () => {
      const { buffer } = service.generateBuffer(params);
      expect(buffer.length).toBeGreaterThan(0);
      expect(() => parse(buffer)).not.toThrow();
    });

    it('contains only the pitches from the notes string', () => {
      const { buffer } = service.generateBuffer(params);
      const pitches = new Set(noteOns(parse(buffer)).map((e) => e.noteNumber));
      for (const p of pitches) {
        expect(EXPECTED_PITCHES).toContain(p);
      }
    });

    it('encodes the correct BPM (131) as a MIDI tempo event', () => {
      const { buffer } = service.generateBuffer(params);
      const tempo = tempoEvent(parse(buffer));
      expect(tempo).toBeDefined();
      expect(tempo!.microsecondsPerBeat).toBe(bpmToMicros(131));
    });

    it('applies sizzle — all velocities are within [1, amp] range', () => {
      const { buffer } = service.generateBuffer(params);
      const velocities = noteOns(parse(buffer)).map((e) => e.velocity);
      expect(velocities.length).toBeGreaterThan(0);
      for (const v of velocities) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(90); // amp ceiling
      }
    });

    it('note hit count matches the number of x steps in the pattern', () => {
      const { buffer } = service.generateBuffer(params);
      // pattern has 32 steps, 16 of which are hits ('x')
      expect(noteOns(parse(buffer)).length).toBe(xCount(params.pattern));
    });
  });

  // ── 2. G minor riff (scale-based) ─────────────────────────────────────────
  // All produced pitches must be members of the G natural minor scale.
  // Pitch classes: G=7  A=9  Bb=10  C=0  D=2  Eb=3  F=5
  describe('G minor riff (command=riff, scale-based)', () => {
    const params: ClipParams = {
      command: 'riff',
      root: 'G3',
      mode: 'minor',
      pattern: 'x-x-x-x-',
      subdiv: '8n',
      bpm: 120,
    };
    const G_MINOR_PITCH_CLASSES = new Set([7, 9, 10, 0, 2, 3, 5]);

    it('produces a parseable MIDI buffer', () => {
      const { buffer } = service.generateBuffer(params);
      expect(() => parse(buffer)).not.toThrow();
    });

    it('all notes belong to the G natural minor scale', () => {
      const { buffer } = service.generateBuffer(params);
      const hits = noteOns(parse(buffer));
      expect(hits.length).toBeGreaterThan(0);
      for (const e of hits) {
        expect(G_MINOR_PITCH_CLASSES).toContain(e.noteNumber % 12);
      }
    });

    it('encodes BPM 120 correctly (500 000 µs/beat)', () => {
      const { buffer } = service.generateBuffer(params);
      const tempo = tempoEvent(parse(buffer));
      expect(tempo!.microsecondsPerBeat).toBe(500_000);
    });

    it('note hit count matches the number of x steps in the pattern', () => {
      const { buffer } = service.generateBuffer(params);
      // pattern "x-x-x-x-" has 4 hits out of 8 steps
      expect(noteOns(parse(buffer)).length).toBe(xCount(params.pattern));
    });
  });

  // ── 3. Chord progression I IV V I in C major ──────────────────────────────
  // Each pattern step maps to one chord from the progression. With pattern
  // "xxxx" and 4 chords of 3 voices each, we expect 12 noteOn events total.
  // scribbletune expects Roman numeral degrees ("I IV V I"), not raw chord names.
  describe('Chord progression I IV V I in C major (command=chord)', () => {
    const params: ClipParams = {
      command: 'chord',
      root: 'C4',
      mode: 'major',
      progression: 'I IV V I',
      pattern: 'xxxx',
      subdiv: '4n',
      bpm: 100,
    };

    it('produces a parseable MIDI buffer', () => {
      const { buffer } = service.generateBuffer(params);
      expect(() => parse(buffer)).not.toThrow();
    });

    it('produces more noteOn events than chord steps (multi-voice chords)', () => {
      const { buffer } = service.generateBuffer(params);
      // 4 chord hits × 3 voices = 12 noteOns
      expect(noteOns(parse(buffer)).length).toBeGreaterThan(xCount(params.pattern));
    });

    it('contains pitch class C (root of CM chord)', () => {
      const { buffer } = service.generateBuffer(params);
      const pitches = noteOns(parse(buffer)).map((e) => e.noteNumber);
      // C at any octave: noteNumber % 12 === 0
      expect(pitches.some((n) => n % 12 === 0)).toBe(true);
    });

    it('encodes BPM 100 correctly', () => {
      const { buffer } = service.generateBuffer(params);
      const tempo = tempoEvent(parse(buffer));
      expect(tempo!.microsecondsPerBeat).toBe(bpmToMicros(100));
    });
  });

  // ── 4. Descending arpeggio i v in A minor ────────────────────────────────
  // Arp unfolds chord tones one at a time. With arpOrder "3210" (descending)
  // and arpCount 4, each chord produces 4 single-note events.
  // scribbletune expects Roman numeral degrees for the progression argument.
  describe('Descending arpeggio i v in A minor (command=arp, arpOrder=3210)', () => {
    const params: ClipParams = {
      command: 'arp',
      root: 'A3',
      mode: 'minor',
      progression: 'i v',
      pattern: 'xxxx',
      subdiv: '8n',
      arpCount: 4,
      arpOrder: '3210',
      bpm: 140,
    };

    it('produces a parseable MIDI buffer', () => {
      const { buffer } = service.generateBuffer(params);
      expect(() => parse(buffer)).not.toThrow();
    });

    it('produces noteOn events (arp unfolds into individual note hits)', () => {
      const { buffer, eventCount } = service.generateBuffer(params);
      expect(eventCount).toBeGreaterThan(0);
      expect(noteOns(parse(buffer)).length).toBeGreaterThan(0);
    });

    it('encodes BPM 140 correctly', () => {
      const { buffer } = service.generateBuffer(params);
      const tempo = tempoEvent(parse(buffer));
      expect(tempo!.microsecondsPerBeat).toBe(bpmToMicros(140));
    });
  });

  // ── 5. Sub bass — D#1 whole note, single note, very low pitch ─────────────
  // D#1 = MIDI note 27 (C1=24, D1=26, D#1=27).
  // Pattern "x_" with subdiv "1m" places one sustained hit per bar.
  describe('Sub bass D#1 whole note (notes override, subdiv=1m)', () => {
    const params: ClipParams = {
      command: 'riff',
      notes: 'D#1',
      pattern: 'x_',
      subdiv: '1m',
      bpm: 131,
    };

    it('produces a parseable MIDI buffer', () => {
      const { buffer } = service.generateBuffer(params);
      expect(() => parse(buffer)).not.toThrow();
    });

    it('note is D#1 (MIDI 27) — a very low sub bass pitch', () => {
      const { buffer } = service.generateBuffer(params);
      const hits = noteOns(parse(buffer));
      expect(hits.length).toBeGreaterThan(0);
      for (const e of hits) {
        expect(e.noteNumber).toBe(27);
      }
    });

    it('MIDI note number is below 30 (confirms sub-bass register)', () => {
      const { buffer } = service.generateBuffer(params);
      for (const e of noteOns(parse(buffer))) {
        expect(e.noteNumber).toBeLessThan(30);
      }
    });
  });

  // ── 6. BPM → MIDI tempo encoding at various tempos ────────────────────────
  describe('BPM → MIDI tempo encoding', () => {
    const cases: Array<{ bpm: number; expectedMicros: number }> = [
      { bpm:  60, expectedMicros: 1_000_000 },
      { bpm: 120, expectedMicros:   500_000 },
      { bpm: 130, expectedMicros:   461_538 },
      { bpm: 174, expectedMicros:   344_828 },
    ];

    it.each(cases)('BPM $bpm → $expectedMicros µs/beat', ({ bpm, expectedMicros }) => {
      const params: ClipParams = {
        command: 'riff',
        notes: 'C4',
        pattern: 'x',
        subdiv: '4n',
        bpm,
      };
      const { buffer } = service.generateBuffer(params);
      const tempo = tempoEvent(parse(buffer));
      expect(tempo).toBeDefined();
      // Allow ±1 µs rounding tolerance
      expect(Math.abs(tempo!.microsecondsPerBeat - expectedMicros)).toBeLessThanOrEqual(1);
    });
  });

  // ── 7. Error paths ─────────────────────────────────────────────────────────
  describe('error paths', () => {
    it('throws when neither notes nor root+mode are provided', () => {
      const params = {
        command: 'riff',
        pattern: 'x-x-',
        bpm: 120,
      } as unknown as ClipParams;
      expect(() => service.generateBuffer(params)).toThrow(/root.*mode|notes/i);
    });

    it('throws when command=chord but progression is missing', () => {
      const params: ClipParams = {
        command: 'chord',
        root: 'C4',
        mode: 'major',
        pattern: 'x---',
        bpm: 120,
      };
      expect(() => service.generateBuffer(params)).toThrow(/progression/i);
    });

    it('throws when command=arp but progression is missing', () => {
      const params: ClipParams = {
        command: 'arp',
        root: 'A3',
        mode: 'minor',
        pattern: 'xxxx',
        bpm: 120,
      };
      expect(() => service.generateBuffer(params)).toThrow(/progression/i);
    });
  });

  // ── 8. ClipSchema validation — amp guard ──────────────────────────────────
  // The agent has consistently misread amp as a 0-1 multiplier and passed amp:1.
  // These tests verify the Zod schema rejects the misconfiguration before the
  // service is ever called.
  describe('ClipSchema — amp validation guard', () => {
    const base = { command: 'riff' as const, notes: 'C4', pattern: 'x', bpm: 120 };

    it('rejects amp=1 with a clear message about MIDI velocity range', () => {
      const result = ClipSchema.safeParse({ ...base, amp: 1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues[0].message;
        expect(msg).toMatch(/not a 0-1 multiplier/i);
        expect(msg).toMatch(/MIDI velocity/i);
      }
    });

    it('rejects amp=1 with sizzle active', () => {
      const result = ClipSchema.safeParse({ ...base, amp: 1, sizzle: 'rampUp' });
      expect(result.success).toBe(false);
    });

    it('rejects any amp below 20', () => {
      for (const amp of [0, 1, 5, 19]) {
        const result = ClipSchema.safeParse({ ...base, amp });
        expect(result.success).toBe(false);
      }
    });

    it('accepts amp=20 (boundary)', () => {
      const result = ClipSchema.safeParse({ ...base, amp: 20 });
      expect(result.success).toBe(true);
    });

    it('accepts amp=90 (typical value)', () => {
      const result = ClipSchema.safeParse({ ...base, amp: 90 });
      expect(result.success).toBe(true);
    });

    it('accepts omitted amp (optional)', () => {
      const result = ClipSchema.safeParse(base);
      expect(result.success).toBe(true);
    });
  });
});
