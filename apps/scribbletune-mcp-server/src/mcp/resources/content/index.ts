export const DOC_OVERVIEW = `# Scribbletune — Overview

Scribbletune is a Node.js library for generating MIDI files programmatically.
Everything revolves around the **clip** — a sequence of note events with
rhythm and articulation. Clips are generated with one of three commands:

| Command | Use for |
|---------|---------|
| \`riff\`   | Melodic lines, basslines, single-note sequences drawn from a scale |
| \`chord\`  | Block chord progressions (PADs, stabs, harmonic beds) |
| \`arp\`    | Arpeggiated chord progressions — same chords as \`chord\` but notes played one at a time |

## Typical workflow

1. Choose \`command\`, \`root\`, \`mode\` (see **Scales** doc)
2. For \`chord\` or \`arp\`: optionally call the \`get-progression\` tool first to discover
   human-readable chord names for a set of scale degrees (e.g. "I IV V ii"),
   then pass those **degrees** as the \`progression\` parameter to \`generate-clip\`
3. Write a \`pattern\` string (see **Notes & Patterns** doc)
4. Pick a \`subdiv\` and \`bpm\`
5. Optionally add articulation (\`sizzle\`, \`accent\`, \`amp\`)
6. Call \`generate-clip\` — returns a download URL for the MIDI file
`;

export const DOC_CLIP = `# Scribbletune — clip() Parameters

The \`clip()\` function is the core of Scribbletune. It takes a config object
and returns an array of note events used by \`midi()\` to write the file.

## Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| \`notes\` | string \| string[] | required | Notes to play. See **Notes & Patterns** doc. |
| \`pattern\` | string | required | Rhythm pattern. See **Notes & Patterns** doc. |
| \`subdiv\` | string | \`'4n'\` | Duration of each \`x\` step. |
| \`shuffle\` | boolean | \`false\` | Randomises note order. |
| \`sizzle\` | boolean \| string | — | Velocity envelope: \`true\`/\`'sin'\`, \`'cos'\`, \`'rampUp'\`, \`'rampDown'\` |
| \`sizzleReps\` | number | — | How many times the sizzle envelope repeats over the pattern. |
| \`accent\` | string | — | Secondary pattern marking accented beats with \`x\` and non-accented with \`-\`. |
| \`amp\` | number | \`100\` | Velocity for accented notes (0–127). |
| \`accentLow\` | number | \`50\` | Velocity for non-accented notes (0–127). |

## subdiv values

\`'16n'\` \`'8n'\` \`'4n'\` \`'2n'\` \`'1n'\` \`'1m'\` \`'2m'\` \`'3m'\` \`'4m'\`

A quarter note is \`'4n'\`, an eighth is \`'8n'\`, a sixteenth is \`'16n'\`,
a whole bar is \`'1m'\`.

## sizzle shapes

- \`'sin'\` — smooth rise and fall (sine wave) — natural, organic feel
- \`'cos'\` — starts loud, dips, returns — inverted variation
- \`'rampUp'\` — builds from quiet to loud — growing energy
- \`'rampDown'\` — starts loud, fades — dying energy

Use \`sizzleReps\` to repeat the envelope N times across the full pattern.
`;

export const DOC_NOTES_AND_PATTERNS = `# Scribbletune — Notes & Patterns

## Note names

Notes follow the format \`{Pitch}{Octave}\`, e.g. \`C4\`, \`Eb3\`, \`G#5\`.

- Pitches: \`C\` \`D\` \`E\` \`F\` \`G\` \`A\` \`B\`
- Sharps: \`C#\` \`D#\` \`F#\` \`G#\` \`A#\`
- Flats: \`Cb\` \`Db\` \`Eb\` \`Gb\` \`Ab\` \`Bb\`
- Octave: integer, typically 2–6. Middle C is \`C4\`.

## Passing notes to clip()

- Single note string: \`'C4'\`
- Space-separated string: \`'C4 D4 E4 F4'\`
- Array: \`['C4', 'Eb4', 'G4']\`
- Chord names (for \`chord\`/\`arp\` commands): \`'CM FM GM Am'\`
- Output of \`scale('G#3 minor')\` — returns an array of note strings

## Pattern syntax

Each character in the pattern string represents one subdivison step (\`subdiv\`):

| Char | Meaning |
|------|---------|
| \`x\`  | Play the next note |
| \`-\`  | Rest (silence) |
| \`_\`  | Sustain the previous note (extend it) |
| \`R\`  | Play a random note from the note list at a random velocity |
| \`[\` \`]\` | Subdivide this step into equal parts |

## Pattern length vs note count

The pattern repeats (or is trimmed) to consume all provided notes.
With \`fitPattern: true\` (default), the pattern is auto-repeated until
it covers all notes — useful when the note array is longer than the pattern.

## Common pattern examples

| Pattern | Character | Feel |
|---------|-----------|------|
| \`'xxxxxxxx'\` | 8× \`x\`, \`8n\` | Straight eighths — driving |
| \`'x-x-x-x-'\` | Off-beat rests | Four-on-the-floor type |
| \`'x--x--x-'\` | Syncopated | Groovy, off-beat |
| \`'x___x___'\` | Whole-note feel | Slow, legato |
| \`'x-x--x-x'\` | Typical bass | Bouncy minimal bass |
| \`'xxxx'\`, \`'1m'\` subdiv | One chord per bar | PAD / block chords |
`;

export const DOC_SCALES = `# Scribbletune — Scales

## Usage

\`\`\`ts
import { scale } from 'scribbletune';
const notes = scale('G#3 minor'); // ['G#3','A#3','B3','C#4','D#4','E4','F#4']
\`\`\`

The returned array is passed directly to \`clip({ notes })\`.

## Format

\`'{Root}{Octave} {scaleName}'\` — root note + octave + exact scale name from the list below.

## All available scale names

The following names are valid. They must be used **exactly** as written:

\`major\` \`minor\` \`ionian\` \`dorian\` \`phrygian\` \`lydian\` \`mixolydian\`
\`aeolian\` \`locrian\`

\`harmonic minor\` \`melodic minor\` \`harmonic major\` \`double harmonic major\`
\`double harmonic lydian\`

\`major pentatonic\` \`minor pentatonic\` \`ionian pentatonic\` \`mixolydian pentatonic\`
\`lydian pentatonic\` \`locrian pentatonic\` \`minor six pentatonic\`
\`flat three pentatonic\` \`flat six pentatonic\` \`whole tone pentatonic\`
\`lydian #5P pentatonic\` \`lydian dominant pentatonic\` \`minor #7M pentatonic\`
\`super locrian pentatonic\`

\`minor hexatonic\` \`augmented\` \`major blues\` \`minor blues\` \`composite blues\`

\`whole tone\` \`diminished\` \`half-whole diminished\`

\`lydian dominant\` \`lydian augmented\` \`lydian minor\` \`lydian #9\` \`lydian diminished\`
\`locrian major\` \`locrian 6\` \`locrian #2\` \`ultralocrian\`
\`dorian b2\` \`dorian #4\` \`phrygian dominant\`
\`mixolydian b6\` \`leading whole tone\` \`altered\`

\`augmented heptatonic\` \`romanian minor\` \`hungarian minor\` \`hungarian major\`
\`oriental\` \`flamenco\` \`persian\` \`balinese\` \`neopolitan major\` \`neopolitan major pentatonic\`
\`enigmatic\` \`major augmented\` \`spanish heptatonic\` \`todi raga\` \`purvi raga\` \`kafi raga\`

\`bebop\` \`bebop minor\` \`bebop major\` \`bebop locrian\` \`minor bebop\`

\`ritusen\` \`egyptian\` \`vietnamese 1\` \`pelog\` \`kumoijoshi\` \`hirajoshi\` \`iwato\`
\`in-sen\` \`malkos raga\` \`scriabin\` \`mystery #1\` \`six tone symmetric\`
\`messiaen's mode #3\` \`messiaen's mode #4\` \`messiaen's mode #5\`
\`messiaen's mode #6\` \`messiaen's mode #7\`
\`prometheus\` \`prometheus neopolitan\` \`piongio\`
\`ichikosucho\` \`minor six diminished\`

Plus 72 Melakarta ragas: \`Kanakangi\` \`Ratnangi\` \`Ganamurti\` \`Vanaspati\`
\`Manavati\` \`Tanarupi\` \`Senavati\` \`Hanumatodi\` \`Dhenuka\` \`Natakapriya\`
\`Kokilapriya\` \`Rupavati\` \`Gayakapriya\` \`Vakulabharanam\` \`Mayamalavagowla\`
\`Chakravakam\` \`Suryakantam\` \`Hatakambari\` \`Jhankaradhwani\` \`Natabhairavi\`
\`Keeravani\` \`Kharaharapriya\` \`Gourimanohari\` \`Varunapriya\` \`Mararanjani\`
\`Charukesi\` \`Sarasangi\` \`Harikambhoji\` \`Dheerasankarabaranam\` \`Naganandini\`
\`Yagapriya\` \`Ragavardhini\` \`Gangeyabhushani\` \`Vagadheeswari\` \`Shulini\`
\`Chalanata\` \`Salagam\` \`Jalarnavam\` \`Jhalavarali\` \`Navaneetam\` \`Pavani\`
\`Raghupriya\` \`Gavambhodi\` \`Bhavapriya\` \`Shubhapantuvarali\` \`Shadvidamargini\`
\`Suvarnangi\` \`Divyamani\` \`Dhavalambari\` \`Namanarayani\` \`Kamavardhini\`
\`Ramapriya\` \`Gamanashrama\` \`Vishwambari\` \`Shamalangi\` \`Shanmukhapriya\`
\`Simhendramadhyamam\` \`Hemavati\` \`Dharmavati\` \`Neetimati\` \`Kantamani\`
\`Rishabhapriya\` \`Latangi\` \`Vachaspati\` \`Mechakalyani\` \`Chitrambari\`
\`Sucharitra\` \`Jyoti swarupini\` \`Dhatuvardani\` \`Nasikabhushini\` \`Kosalam\`
\`Rasikapriya\`
`;

export const DOC_CHORDS = `# Scribbletune — Chords

## Direct chord usage

Pass chord names directly as the \`notes\` parameter of \`clip()\`:

\`\`\`ts
clip({ notes: 'CM FM GM Am', pattern: 'x___'.repeat(4), subdiv: '1m' })
\`\`\`

## chord() function

Returns the individual notes of a chord:

\`\`\`ts
import { chord } from 'scribbletune';
chord('C4 M')  // ['C4','E4','G4']
chord('C4 m')  // ['C4','Eb4','G4']
\`\`\`

Format: \`'{Root}{Octave} {ChordType}'\`

## Available chord types (use exactly as written)

**Triads / basics:**
\`M\` \`m\` \`aug\` \`dim\` \`sus2\` \`sus4\` \`4th\` \`5th\`

**Sevenths:**
\`maj7\` \`7th\` \`m7\` \`dim7\` \`m7b5\` \`mMaj7b6\` \`M7b6\` \`M7b5\`
\`maj7#5\` \`m/ma7\` \`oM7\` \`o7M7\` \`7no5\` \`7b5\` \`7#5\`

**Sixths:**
\`6th\` \`m6\` \`M6#11\` \`6/9\`

**Ninths:**
\`maj9\` \`9th\` \`m9\` \`Madd9\` \`madd9\` \`mM9\` \`9b5\` \`9#5\`

**Elevenths / Thirteenths:**
\`11th\` \`m11\` \`m11A\` \`13th\` \`maj13\` \`m13\`

**Altered / extended:**
\`7b9\` \`7#9\` \`7b13\` \`7#11\` \`7#5b9\` \`7b9#11\` \`alt7\` \`7sus4b9b13\`

Full list: run \`chords()\` from the scribbletune package for all 100+ types.

## Chord notation in generate-clip

When using \`command=chord\` or \`command=arp\`, the \`progression\` parameter
**requires Roman numeral scale degrees** — e.g. \`"I IV V ii"\` (major) or
\`"i VI III VII"\` (minor). Raw chord names (\`"CM FM GM"\`) are **not** accepted.

Use the \`get-progression\` tool to discover which degrees are available for a
given root and mode, then copy the returned \`degrees\` value into \`progression\`.

### Pattern vs chord count

Each \`x\` step in the pattern plays the **next chord** in the progression in sequence.
With 4 chords and pattern \`"x---"\` only the first chord sounds (1 hit in 4 steps).
Use \`"xxxx"\` to hit all 4 chords, or repeat the pattern accordingly.
`;

export const DOC_PROGRESSION = `# Scribbletune — Progressions

## When to use the get-progression tool

Call \`get-progression\` **before** \`generate-clip\` when:
- Using \`command=chord\` or \`command=arp\`
- You want to reason about scale degrees ("I IV V ii") rather than chord names
- The user describes harmonic content ("minor with a surprise major four chord")

For \`command=riff\` (bassline, melody) — skip \`get-progression\` entirely.

## getChordsByProgression()

Maps Roman numeral scale-degree strings to human-readable chord names for a given root + mode.
This is what the \`get-progression\` tool uses internally.

\`\`\`ts
getChordsByProgression('C4 major', 'I IV V ii')
// → 'CM_4 FM_4 GM_4 Dm_4'  (for reference only — chord names with octave suffix)
\`\`\`

**Important:** pass the **degrees** (\`"I IV V ii"\`) as the \`progression\` parameter
to \`generate-clip\`, not the chord name output. The tool resolves degrees internally.

## Chord degrees by mode

| Mode | Degrees |
|------|---------|
| \`major\` / \`ionian\` | I ii iii IV V vi vii° |
| \`minor\` / \`aeolian\` | i ii° III iv v VI VII |
| \`dorian\` | i ii III IV v vi° VII |
| \`phrygian\` | i II III iv v° VI vii |
| \`lydian\` | I II iii iv° V vi vii |
| \`mixolydian\` | I ii iii° IV v vi VII |
| \`locrian\` | i° II iii iv V VI vii |
| \`harmonic minor\` | i ii° III iv V VI vii° |
| \`melodic minor\` | i ii III IV V vi° vii° |

## progression() — random generation

Generates a musically sensible random progression:

\`\`\`ts
progression('major', 4)  // e.g. ['I','IV','V','ii']
progression('minor', 4)  // e.g. ['i','VI','III','VII']
\`\`\`

Follows tonal grammar: Tonic → PreDominant → Dominant → Tonic.
`;

export const DOC_GENRE_SCALE_GUIDE = `# Genre → Scale & Pattern Guide

This guide maps electronic music genres to recommended Scribbletune parameters.
Use it to translate user intent into concrete \`mode\`, \`pattern\`, \`subdiv\` and \`bpm\` values.

## Deep Tech / Minimal Techno

- **Mode:** \`dorian\` (darker groove), \`phrygian\` (tense, hypnotic)
- **BPM:** 126–134
- **Subdiv:** \`16n\` for basslines, \`8n\` for melodic motifs
- **Patterns:** \`'x-x--x-x'\` \`'x--xx--x'\` \`'x-x-x--x'\`
- **Articulation:** sizzle \`'sin'\` for organic velocity, low \`accentLow\` (30–50)
- **Feel:** Repetitive, hypnotic, sparse. Avoid busy patterns.

## Techno / Industrial

- **Mode:** \`phrygian\` \`locrian\` \`harmonic minor\`
- **BPM:** 130–145
- **Subdiv:** \`16n\`
- **Patterns:** \`'x-xx-x-x'\` \`'xx-x-xx-'\`
- **Articulation:** Hard velocities, no sizzle or \`'rampUp'\`

## House / Deep House

- **Mode:** \`minor\` \`dorian\` \`mixolydian\`
- **BPM:** 120–128
- **Subdiv:** \`8n\`
- **Patterns:** \`'x-x-x-x-'\` (straight eighths for bass), \`'x--x-x--'\` (syncopated)
- **Articulation:** \`sizzle: 'sin'\`, moderate \`amp\` (80–100)

## Ambient / Downtempo

- **Mode:** \`lydian\` (dreamy, floating) \`whole tone\` (ethereal, unresolved)
- **BPM:** 60–90
- **Subdiv:** \`2n\` or \`1m\`
- **Patterns:** \`'x___'\` \`'x_______'\` (long sustains)
- **Articulation:** \`sizzle: 'sin'\` with high \`sizzleReps\`, soft \`amp\` (50–70)

## Drum & Bass / Liquid DnB

- **Mode:** \`minor\` \`harmonic minor\`
- **BPM:** 170–180
- **Subdiv:** \`16n\`
- **Patterns:** \`'x-xx--x-'\` \`'x--x-x--'\`
- **Articulation:** Punchy, hard hits, \`accentLow\` very low (20–30)

## Lo-fi Hip Hop

- **Mode:** \`minor pentatonic\` \`dorian\`
- **BPM:** 70–90
- **Subdiv:** \`8n\`
- **Patterns:** \`'x-x--x-x'\` with some \`R\` for variation
- **Articulation:** \`sizzle: 'cos'\`, low \`amp\` (60–80), imperfect feel

## Jazz / Neo-soul

- **Mode:** \`dorian\` \`mixolydian\` \`bebop\` \`bebop minor\`
- **BPM:** 80–120
- **Subdiv:** \`8n\` \`'4n'\`
- **Patterns:** Varied, syncopated; use \`accent\` heavily
- **Articulation:** \`accent: 'x--x'\`, wide velocity range

## Bassline guidance

Basslines use \`command=riff\` — no progression tool needed.

| Genre | Root area | Pattern example | Subdiv |
|-------|-----------|-----------------|--------|
| Deep Tech | Octave 2–3 | \`'x-x--x-x'\` | \`16n\` |
| House | Octave 2–3 | \`'x-x-x-x-'\` | \`8n\` |
| DnB | Octave 2 | \`'x-xx--x-'\` | \`16n\` |
| Lo-fi | Octave 3 | \`'x-x--x--'\` | \`8n\` |

## Sub bass vs top bass (overlay approach)

To layer sub + top bass (e.g. Deep Tech):
1. Call \`generate-clip\` with root at octave **2** (sub), pattern sparse: \`'x---x---'\`
2. Call \`generate-clip\` again with root at octave **3** (top), pattern active: \`'x-x--x-x'\`
Import both MIDI clips into separate DAW tracks and layer.
`;
