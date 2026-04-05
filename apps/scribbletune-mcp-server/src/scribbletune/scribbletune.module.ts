import { Module } from '@nestjs/common';
import { ScribbletunService } from './scribbletune.service';

@Module({
  providers: [ScribbletunService],
  exports: [ScribbletunService],
})
export class ScribbletunModule {}
