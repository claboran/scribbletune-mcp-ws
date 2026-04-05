import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import {
  DOC_OVERVIEW,
  DOC_CLIP,
  DOC_NOTES_AND_PATTERNS,
  DOC_SCALES,
  DOC_CHORDS,
  DOC_PROGRESSION,
  DOC_GENRE_SCALE_GUIDE,
} from './content';

const MIME = 'text/markdown';

@Injectable()
export class ScribbletunDocsResource {
  @Resource({ uri: 'scribbletune://docs/overview', name: 'Overview', mimeType: MIME })
  getOverview() {
    return { contents: [{ uri: 'scribbletune://docs/overview', text: DOC_OVERVIEW, mimeType: MIME }] };
  }

  @Resource({ uri: 'scribbletune://docs/clip', name: 'Clip Parameters', mimeType: MIME })
  getClip() {
    return { contents: [{ uri: 'scribbletune://docs/clip', text: DOC_CLIP, mimeType: MIME }] };
  }

  @Resource({ uri: 'scribbletune://docs/notes-and-patterns', name: 'Notes & Patterns', mimeType: MIME })
  getNotesAndPatterns() {
    return { contents: [{ uri: 'scribbletune://docs/notes-and-patterns', text: DOC_NOTES_AND_PATTERNS, mimeType: MIME }] };
  }

  @Resource({ uri: 'scribbletune://docs/scales', name: 'Scales', mimeType: MIME })
  getScales() {
    return { contents: [{ uri: 'scribbletune://docs/scales', text: DOC_SCALES, mimeType: MIME }] };
  }

  @Resource({ uri: 'scribbletune://docs/chords', name: 'Chords', mimeType: MIME })
  getChords() {
    return { contents: [{ uri: 'scribbletune://docs/chords', text: DOC_CHORDS, mimeType: MIME }] };
  }

  @Resource({ uri: 'scribbletune://docs/progression', name: 'Progressions', mimeType: MIME })
  getProgression() {
    return { contents: [{ uri: 'scribbletune://docs/progression', text: DOC_PROGRESSION, mimeType: MIME }] };
  }

  @Resource({ uri: 'scribbletune://docs/genre-scale-guide', name: 'Genre → Scale Guide', mimeType: MIME })
  getGenreScaleGuide() {
    return { contents: [{ uri: 'scribbletune://docs/genre-scale-guide', text: DOC_GENRE_SCALE_GUIDE, mimeType: MIME }] };
  }
}
