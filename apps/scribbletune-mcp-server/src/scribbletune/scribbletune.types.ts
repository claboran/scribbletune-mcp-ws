export type ClipParams = {
  command: 'riff' | 'chord' | 'arp';
  notes?: string;           // raw override — bypasses root+mode resolution
  root?: string;            // required when notes is absent
  mode?: string;            // required when notes is absent
  pattern: string;
  subdiv?: string;
  progression?: string;
  bpm: number;
  amp?: number;
  sizzle?: 'sin' | 'cos' | 'rampUp' | 'rampDown';
  sizzleReps?: number;
  accent?: string;
  accentLow?: number;
  arpCount?: number;
  arpOrder?: string;
};
