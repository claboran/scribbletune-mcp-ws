import { z } from 'zod';

export const ClipSchema = z
  .object({
    command: z
      .enum(['riff', 'chord', 'arp'])
      .describe(
        'riff=melodic line / bassline from scale; chord=block chord progression; arp=arpeggiated chords',
      ),

    // --- notes override ---
    notes: z
      .string()
      .optional()
      .describe(
        'Raw notes override — space-separated note names or chord names, e.g. "C4 E4 G4 B4" or "CM FM GM Am". ' +
        'When provided, bypasses root+mode resolution entirely. ' +
        'root and mode are then optional and ignored for note resolution.',
      ),

    // --- scale-based resolution (required when notes is absent) ---
    root: z
      .string()
      .optional()
      .describe('Root note with octave, e.g. "G#3". Required unless notes is provided.'),
    mode: z
      .string()
      .optional()
      .describe(
        'Scale name exactly as listed in scribbletune://docs/scales, e.g. "minor", "dorian", "phrygian". ' +
        'Required unless notes is provided.',
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
        'Required for command=chord or command=arp (when not using notes override). ' +
        'Must be Roman numeral scale degrees, e.g. "I IV V ii" (major) or "i VI III VII" (minor). ' +
        'Use the get-progression tool to discover valid degrees for a given root+mode. ' +
        'Do NOT pass raw chord names ("CM FM GM") — they are not accepted here.',
      ),
    bpm: z.number().int().min(20).max(300).describe('Tempo in BPM'),
    amp: z
      .number()
      .min(0)
      .max(127)
      .optional()
      .describe(
        'Peak MIDI velocity (0–127). This is the CEILING of the sizzle envelope, not a volume multiplier. ' +
        'Typical useful range: 70–100. Values below 20 will produce near-silent or inaudible output. ' +
        'Default is 100 when omitted.',
      ),
    sizzle: z
      .enum(['sin', 'cos', 'rampUp', 'rampDown'])
      .optional()
      .describe(
        'Velocity envelope shape applied across all pattern steps. ' +
        '"sin" — rises from near-0 to amp then back to near-0 (first and last notes nearly silent). ' +
        '"cos" — starts at amp, dips to near-0 at midpoint, returns to amp. ' +
        '"rampUp" — builds steadily from near-0 to amp (good for energy build-ups). ' +
        '"rampDown" — fades from amp to near-0. ' +
        'accentLow has NO effect when sizzle is active — it only works with the accent pattern.',
      ),
    sizzleReps: z.number().int().positive().optional().describe('How many times the sizzle envelope repeats across the pattern. Default 1.'),
    accent: z.string().optional().describe('Accent pattern, e.g. "x--x" — marks strong beats with x. Works together with accentLow.'),
    accentLow: z
      .number()
      .int()
      .min(0)
      .max(127)
      .optional()
      .describe(
        'Velocity for non-accented steps when using the accent pattern (0–127). ' +
        'Has NO effect when sizzle is active — ignored unless accent is also provided.',
      ),
    arpCount: z
      .number()
      .int()
      .min(2)
      .max(8)
      .optional()
      .describe('Notes per chord for arp command (default 4)'),
    arpOrder: z
      .string()
      .optional()
      .describe('Arp note order as digit string, e.g. "0123" ascending, "3210" descending'),
  })
  .superRefine((data, ctx) => {
    if (!data.notes && (!data.root || !data.mode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either "notes" or both "root" and "mode" must be provided.',
        path: ['notes'],
      });
    }

    if (data.amp !== undefined && data.amp < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `amp=${data.amp} is not a 0-1 multiplier — it is a MIDI velocity in the range 0-127. ` +
          `Values below 20 will produce a near-silent or completely inaudible clip. Use amp between 70 and 100 for normal playback.`,
        path: ['amp'],
      });
    }
  });
