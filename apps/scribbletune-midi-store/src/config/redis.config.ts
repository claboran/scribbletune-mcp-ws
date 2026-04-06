import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  ttlSeconds: parseInt(process.env['MIDI_TTL_SECONDS'] ?? '3600', 10),
  publicUrl: process.env['PUBLIC_URL'] ?? 'http://localhost:3001',
}));
