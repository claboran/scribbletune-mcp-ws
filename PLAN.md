# Scribbletune MCP Server — Planning Document

> Status: **Draft v4 — updated 2026-04-06**
> Date: 2026-04-06

---

## 1. Goal

Build a NestJS-based MCP server (using `@rekog/mcp-nest`) that acts as a creative MIDI-generation backend. An LLM agent reads Scribbletune concept docs exposed as MCP resources, translates a musical idea into a structured tool call, and stores the resulting MIDI in a dedicated store service. The user downloads the MIDI file via a plain HTTP endpoint served by that store service — the MCP server is never involved in the download path.

---

## 2. Architecture Overview

```
Agent / MCP Client
       │
       │  MCP (Streamable HTTP)
       ▼
┌─────────────────────────────────────┐
│     scribbletune-mcp-server         │
│     (port 3000)                     │
│                                     │
│  Resources: static concept docs     │
│  Tools: generate-clip               │
│          get-progression            │
│                                     │
│  ScribbletunService                 │
│   midi(notes, null, bpm)            │
│   → Buffer.from(bytes, 'binary')    │
│          │                          │
│          │ POST /clips (octet-stream)│
└──────────┼──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│     scribbletune-midi-store         │
│     (port 3001)                     │
│                                     │
│  POST /clips  → Redis → key         │
│  GET  /clips/:key → stream .mid     │
└──────────────┬──────────────────────┘
               │
               ▼
         Redis / Valkey
```

**Write path:** MCP tool → ScribbletunService → `POST /clips` → midi-store → Redis → returns `{ key, downloadUrl }`

**Download path:** User → `GET /clips/:key` → midi-store → `.mid` stream  
*(MCP server not in this path)*

---

## 3. Apps in the Nx Workspace

```
apps/
  scribbletune-mcp-server/    # MCP server, port 3000
  scribbletune-midi-store/    # MIDI store REST service, port 3001
```

> **Migration note:** The workspace currently contains `apps/kv-server` and `apps/kv-server-e2e` — these are superseded by `scribbletune-midi-store` and must be deleted before scaffolding begins.

No shared libs for v1. Resource Markdown content lives inline in `scribbletune-mcp-server` — it is an integral part of the MCP server, not a reusable concern.

No E2E apps — integration is validated manually with the MCP Inspector and direct HTTP calls (`curl`/Postman) against the running services.

---

## 4. Transport

- **Streamable HTTP only** — `McpTransportType.STREAMABLE_HTTP`
- SSE and STDIO explicitly excluded
- Endpoint: `POST /mcp` (stateless mode, `enableJsonResponse: true`)
- Inspector target on `scribbletune-mcp-server`'s `project.json`:  
  `npx @modelcontextprotocol/inspector http://localhost:3000/mcp`

---

## 5. App: `scribbletune-mcp-server`

### Module structure

```
apps/scribbletune-mcp-server/src/
├── main.ts
├── app/
│   └── app.module.ts
├── mcp/
│   ├── mcp.module.ts
│   ├── resources/
│   │   ├── content/                        # Static .md files, loaded at startup
│   │   │   ├── 01-overview.md
│   │   │   ├── 02-clip.md
│   │   │   ├── 03-notes-and-patterns.md
│   │   │   ├── 04-scales.md
│   │   │   ├── 05-chords.md
│   │   │   ├── 06-progression.md
│   │   │   └── 07-genre-scale-guide.md     # Hand-authored: genre → scale mapping
│   │   └── scribbletune-docs.resource.ts
│   └── tools/
│       ├── clip-generator.tool.ts
│       └── progression.tool.ts
└── scribbletune/
    └── scribbletune.service.ts
```

### Dependencies added to mcp-server
| Package | Purpose |
|---------|---------|
| `scribbletune` | MIDI generation |
| `@nestjs/axios` | HTTP calls to midi-store |
| `@nestjs/config` | Env config (`MIDI_STORE_URL`) |

---

## 6. MCP Resources — Scribbletune Concept Docs

Static Markdown loaded at startup, served via `@Resource` with `mimeType: 'text/markdown'`. These are the LLM's reference — the quality of these docs directly determines how well the agent avoids hallucinating invalid values.

| URI | File | Content |
|-----|------|---------|
| `scribbletune://docs/overview` | `01-overview.md` | What Scribbletune is, clip-centric model, three command modes (riff/chord/arp), typical workflow |
| `scribbletune://docs/clip` | `02-clip.md` | Full `clip()` parameter reference: notes, pattern syntax (`x`/`-`/`_`/`R`/`[`/`]`), subdiv values, sizzle, amp, accent |
| `scribbletune://docs/notes-and-patterns` | `03-notes-and-patterns.md` | Note name format (`C4`, `Eb3`, `G#5`), octave ranges, pattern rhythm examples |
| `scribbletune://docs/scales` | `04-scales.md` | All 80+ available scale names (exhaustive list), `scale()` signature, how notes are returned |
| `scribbletune://docs/chords` | `05-chords.md` | `chord()` / `chords()` API, 100+ chord types, chord notation in `clip()` notes (`'CM FM GM'`), inversions |
| `scribbletune://docs/progression` | `06-progression.md` | `progression()`, `getChordsByProgression()`, `getChordDegrees()` — how to build progressions from scale degrees |
| `scribbletune://docs/genre-scale-guide` | `07-genre-scale-guide.md` | **Hand-authored** mapping of electronic music genres → recommended scales, moods, common patterns (see §6.1) |

### 6.1 Genre–Scale Guide (hand-authored — key resource)

This resource is not from the Scribbletune docs. It bridges the gap between a user saying "Deep Tech, dark, plucky" and a valid `scale()` call. It covers:

- **Deep Tech / Minimal**: dorian, phrygian — dark, hypnotic; typical patterns `x-x--x-x` at 126–134 BPM
- **Techno**: phrygian, locrian, harmonic minor — industrial; fast subdivisions `16n`
- **House**: minor, dorian, mixolydian — groovy; `8n` basis
- **Ambient / Downtempo**: lydian, whole tone — ethereal; long sustains `x___`
- **Jazz / Neo-soul**: mixolydian, dorian, bebop major/minor — complex chords, chromatic runs
- **Blues**: blues scale — obvious but worth listing
- **Drum & Bass**: minor, harmonic minor — fast, aggressive
- **Lo-fi**: minor pentatonic, dorian — mellow, imperfect patterns

> This is the resource most likely to reduce hallucination in genre-specific requests. It should be written carefully and reviewed against real production practice.

---

## 7. MCP Tools

### 7.1 Tool: `generate-clip`

Generates a MIDI clip for one musical idea, stores it in the midi-store, returns a download key and URL.

**Scope:** one musical idea = one clip (riff, chord progression, or arpeggio).

#### Input schema (Zod)

```ts
z.object({
  // Command type — determines what gets generated
  command: z.enum(['riff', 'chord', 'arp']).describe(
    'riff=melodic line from scale degrees; chord=chord progression block; arp=arpeggiated chords'
  ),

  // Core musical params
  root: z.string().describe('Root note with octave, e.g. "G#3"'),
  mode: z.string().describe(
    'Scale/mode name exactly as returned by scribbletune scales(), e.g. "minor", "dorian", "phrygian"'
  ),
  pattern: z.string().describe(
    'Rhythm: x=hit, -=rest, _=sustain prev, R=random. E.g. "x-x-x--x". Can use .repeat() syntax.'
  ),
  subdiv: z.string().default('8n').describe(
    'Note duration per step: "16n" "8n" "4n" "2n" "1n" "1m"'
  ),

  // chord / arp only
  progression: z.string().optional().describe(
    'Chord progression: digit string "1645", roman numerals "I IV V", chord names "CM FM GM", or "random"'
  ),

  // Timing
  bpm: z.number().int().min(20).max(300).describe('Tempo in BPM'),

  // Articulation (all optional)
  amp: z.number().min(0).max(127).optional().describe('Max velocity 0-127'),
  sizzle: z.enum(['sin', 'cos', 'rampUp', 'rampDown']).optional().describe(
    'Velocity envelope shape over the pattern'
  ),
  sizzleReps: z.number().int().positive().optional(),
  accent: z.string().optional().describe('Accent pattern, e.g. "x--x"'),
  accentLow: z.number().int().min(0).max(127).optional(),
  fitPattern: z.boolean().default(true).describe(
    'Auto-repeat pattern until it covers all generated notes'
  ),
})
```

#### Return value

```json
{
  "key": "clips:a3f9c2d1-...",
  "downloadUrl": "http://<PUBLIC_URL>/clips/clips:a3f9c2d1-...",
  "ttlSeconds": 3600,
  "meta": {
    "command": "riff",
    "root": "G#3",
    "mode": "minor",
    "bpm": 131,
    "eventCount": 32
  }
}
```

---

### 7.2 Tool: `get-progression`

A **pure computation tool** — no MIDI, no Redis. Only relevant when `command=chord` or `command=arp` (e.g. a PAD, a chord stab). For single-note ideas like basslines or melodies (`command=riff`) this tool is not needed and should not be called.

#### Input schema (Zod)

```ts
z.object({
  root: z.string().describe('Root note with octave, e.g. "C4"'),
  mode: z.enum(['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian',
                'locrian', 'harmonic minor', 'melodic minor']).describe(
    'Scale/mode to derive chords from'
  ),
  degrees: z.string().optional().describe(
    'Space-separated chord degrees, e.g. "I IV V ii". If omitted, a random progression is generated.'
  ),
  count: z.number().int().min(2).max(8).optional().default(4).describe(
    'Number of chords if generating randomly'
  ),
})
```

#### Return value

```json
{
  "degrees": ["I", "IV", "V", "ii"],
  "chordNames": "CM FM GM Dm",
  "hint": "Pass chordNames as the `progression` param of generate-clip with command=chord or command=arp"
}
```

This removes a reasoning step from the LLM: it doesn't have to guess what `"I IV V"` resolves to in G# minor — the tool does it.

---

## 8. App: `scribbletune-midi-store`

A minimal, focused NestJS app. Single responsibility: store and serve MIDI buffers.

Uses **nestjs-zod** (`nestjs-zod` + `zod`) for all DTOs — no `class-validator`/`class-transformer`.

### Endpoints

| Method | Path | Request | Response |
|--------|------|---------|----------|
| `POST` | `/clips` | `multipart/form-data`: field `file` (MIDI binary) | `{ key, downloadUrl, ttlSeconds }` |
| `GET` | `/clips/:key` | — | `audio/midi` stream, `Content-Disposition: attachment; filename="clip.mid"` |
| `DELETE` | `/clips/:key` | — | `204 No Content` |

### Why `multipart/form-data` for POST?
Fits a REST style better than raw octet-stream: allows adding metadata fields (e.g. `bpm`, `label`) in the same request without a custom content-type parser, and is straightforward to extend later.

### MidiStoreService

```ts
save(buffer: Buffer, ttl?: number): Promise<{ key: string }>
fetch(key: string): Promise<Buffer | null>
delete(key: string): Promise<void>
```

- Key format: `clips:<uuid-v4>`
- TTL default: **3600s** (env `MIDI_TTL_SECONDS`)
- Redis connection: env `REDIS_URL` (e.g. `redis://localhost:6379`)
- Public base URL for `downloadUrl`: env `PUBLIC_URL` (e.g. `http://localhost:3001`)

### Module structure

```
apps/scribbletune-midi-store/src/
├── main.ts
├── app/
│   └── app.module.ts
├── clips/
│   ├── clips.module.ts
│   ├── clips.controller.ts      # POST, GET, DELETE /clips
│   ├── clips.service.ts         # Redis read/write
│   └── clips.dto.ts             # nestjs-zod DTOs for request/response
└── config/
    └── redis.config.ts
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `ioredis` | Redis/Valkey client |
| `uuid` | Key generation |
| `@nestjs/config` | Env config |
| `nestjs-zod` | Zod-based DTOs, no class-validator |
| `@nestjs/platform-express` | Multipart via `multer` |
| `multer` + `@types/multer` | Multipart file handling |

---

## 9. Swagger UI — `scribbletune-midi-store`

`scribbletune-midi-store` exposes a Swagger UI at `GET /api` (mounted in `main.ts`).

### Setup

```ts
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';

patchNestJsSwagger(); // makes nestjs-zod schemas appear in Swagger

const config = new DocumentBuilder()
  .setTitle('Scribbletune MIDI Store')
  .setDescription('Store and retrieve MIDI clips via Valkey')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

The `patchNestJsSwagger()` call is required because DTOs are Zod-based (nestjs-zod), not class-based — without it, Swagger would see no schema properties.

### Additional dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/swagger` | Swagger/OpenAPI integration |

> Swagger is **not** added to `scribbletune-mcp-server` — that app's surface area is the MCP protocol, not a REST API.

---

## 10. ScribbletunService — MIDI Buffer Extraction

```ts
import { clip, midi } from 'scribbletune';

// midi(notes, null, bpm) → returns binary string when fileName is null
const notes = clip({ notes: ..., pattern: ..., subdiv: ... });
const bytes = midi(notes, null, bpm) as string;
const buffer = Buffer.from(bytes, 'binary');
// → ready to POST to midi-store
```

No fork of scribbletune required. This is documented behaviour in v5.5.4 (`midi.ts`: `if (fileName === null) { return bytes; }`).

---

## 11. Local Dev Setup

`docker-compose.yml` at workspace root:

```yaml
services:
  valkey:
    image: valkey/valkey:8-alpine
    ports: ["6379:6379"]
```

Serve both apps:
```bash
npm exec nx run-many --target=serve \
  --projects=scribbletune-mcp-server,scribbletune-midi-store
```

Inspect MCP server (`project.json` target):
```bash
npm exec nx run scribbletune-mcp-server:inspect
# internally: npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

---

## 12. Decisions Locked

| Topic | Decision |
|-------|----------|
| Transport | Streamable HTTP only |
| Resource content location | Inline in `scribbletune-mcp-server` — not a lib |
| Scribbletune fork | Not needed — `midi(notes, null, bpm)` returns bytes |
| Tools | `generate-clip` + `get-progression` |
| Clip scope | One clip per call (v1) |
| Storage service | Dedicated `scribbletune-midi-store` NestJS app |
| `POST /clips` format | `multipart/form-data` |
| Download URL | `PUBLIC_URL` env var on midi-store |
| DTO style | `nestjs-zod` — no class-validator/class-transformer |
| Swagger UI | `scribbletune-midi-store` only, at `/api`; `patchNestJsSwagger()` required |
| Local store | Valkey 8 (Redis-compatible) via docker-compose — not Redis |
| E2E apps | None — validated manually with MCP Inspector + curl |
| Inspector | `nx` target on mcp-server project |
| TTL | 3600s default, env-configurable |
| Auth | Not in scope for v1 |

---

## 13. Work to Do on Resource Content

The Markdown files under `content/` need to be carefully authored. Notes:

- `04-scales.md` must include the **exhaustive list** of all 80+ scale names exactly as scribbletune's `scales()` returns them — the LLM must pick from this list verbatim, not guess
- `05-chords.md` similarly needs the full chord type list from `chords()` 
- `06-progression.md` should clearly explain when to call the `get-progression` tool first vs. directly writing a progression string
- `07-genre-scale-guide.md` is hand-authored creative knowledge — the most important file for reducing hallucination on genre-specific requests

---

## 14. Out of Scope (v1)

- Authentication / authorization
- STDIO and SSE transports
- Multi-track session tool
- Agent / LLM integration (external concern)
- S3 / pre-signed URL storage
- Playback / audio rendering
- E2E test apps (`*-e2e`)
- Swagger on `scribbletune-mcp-server`
