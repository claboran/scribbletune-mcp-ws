import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisProvider implements OnApplicationShutdown {
  readonly client: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>('redis.url') ?? 'redis://localhost:6379';
    this.client = new Redis(url);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
