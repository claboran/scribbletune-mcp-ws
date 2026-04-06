import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClipsController } from './clips.controller';
import { ClipsService, REDIS_CLIENT } from './clips.service';
import { RedisProvider } from './redis.provider';

@Module({
  imports: [ConfigModule],
  controllers: [ClipsController],
  providers: [
    RedisProvider,
    {
      provide: REDIS_CLIENT,
      useFactory: (provider: RedisProvider) => provider.client,
      inject: [RedisProvider],
    },
    ClipsService,
  ],
})
export class ClipsModule {}
