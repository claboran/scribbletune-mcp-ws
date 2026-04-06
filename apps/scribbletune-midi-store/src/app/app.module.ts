import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisConfig } from '../config/redis.config';
import { ClipsModule } from '../clips/clips.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig],
    }),
    ClipsModule,
  ],
})
export class AppModule {}
