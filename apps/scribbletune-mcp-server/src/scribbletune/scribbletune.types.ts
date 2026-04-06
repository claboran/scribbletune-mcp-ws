export type ClipParams = {
  command: 'riff' | 'chord' | 'arp';
  root: string;
  mode: string;
  pattern: string;
  subdiv?: string;
  progression?: string;
  bpm: number;
  amp?: number;
  sizzle?: 'sin' | 'cos' | 'rampUp' | 'rampDown';
  sizzleReps?: number;
  accent?: string;
  accentLow?: number;
  // arp-only
  arpCount?: number;
  arpOrder?: string;
};
