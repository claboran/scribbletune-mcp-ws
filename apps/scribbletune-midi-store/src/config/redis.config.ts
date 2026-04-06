import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => {
  const parsedTtlSeconds = parseInt(process.env['MIDI_TTL_SECONDS'] ?? '3600', 10);
  const ttlSeconds =
    Number.isFinite(parsedTtlSeconds) && parsedTtlSeconds >= 1 ? parsedTtlSeconds : 3600;

  return {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
    ttlSeconds,
    publicUrl: process.env['PUBLIC_URL'] ?? 'http://localhost:3001',
  };
});
