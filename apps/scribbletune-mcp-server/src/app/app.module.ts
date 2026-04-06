import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScribbletuneMcpModule } from '../mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScribbletuneMcpModule,
  ],
})
export class AppModule {}
