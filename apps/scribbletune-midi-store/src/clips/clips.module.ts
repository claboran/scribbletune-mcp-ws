import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ClipsController } from './clips.controller';
import { ClipsService, REDIS_CLIENT } from './clips.service';
import { redisConfig } from '../config/redis.config';

@Module({
  imports: [ConfigModule],
  controllers: [ClipsController],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('redis.url') ?? 'redis://localhost:6379';
        return new Redis(url);
      },
    },
    ClipsService,
  ],
})
export class ClipsModule {}
