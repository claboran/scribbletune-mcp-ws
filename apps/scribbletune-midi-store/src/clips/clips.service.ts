import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { redisConfig } from '../config/redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class ClipsService {
  readonly #logger = new Logger(ClipsService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(redisConfig.KEY) private readonly cfg: ConfigType<typeof redisConfig>,
  ) {}

  async save(buffer: Buffer, ttl?: number): Promise<{ id: string; key: string }> {
    const id = uuidv4();
    const key = `clips:${id}`;
    const effectiveTtl = ttl ?? this.cfg.ttlSeconds;
    await this.redis.setex(key, effectiveTtl, buffer);
    this.#logger.log(`Saved clip key=${key} ttl=${effectiveTtl}s size=${buffer.length}B`);
    return { id, key };
  }

  async fetchById(id: string): Promise<Buffer> {
    const data = await this.redis.getBuffer(`clips:${id}`);
    if (!data) {
      throw new NotFoundException(`Clip not found: ${id}`);
    }
    return data;
  }

  async deleteById(id: string): Promise<void> {
    await this.redis.del(`clips:${id}`);
    this.#logger.log(`Deleted clip id=${id}`);
  }
}
