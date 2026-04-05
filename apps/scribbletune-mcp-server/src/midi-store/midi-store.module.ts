import { Module } from '@nestjs/common';
import { MidiStoreClient } from './midi-store.client';

@Module({
  providers: [MidiStoreClient],
  exports: [MidiStoreClient],
})
export class MidiStoreModule {}
