import { Module } from '@nestjs/common';
import { ScribbletuneMcpModule } from '../mcp/mcp.module';

@Module({
  imports: [ScribbletuneMcpModule],
})
export class AppModule {}
