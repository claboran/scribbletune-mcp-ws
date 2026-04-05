import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { ScribbletunModule } from '../scribbletune/scribbletune.module';
import { MidiStoreModule } from '../midi-store/midi-store.module';
import { ScribbletunDocsResource } from './resources/scribbletune-docs.resource';
import { ClipGeneratorTool } from './tools/clip-generator.tool';
import { ProgressionTool } from './tools/progression.tool';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'scribbletune-mcp-server',
      version: '1.0.0',
      transport: [McpTransportType.STREAMABLE_HTTP],
      streamableHttp: {
        statelessMode: true,        // explicitly stateless — no session tracking
        enableJsonResponse: true,
      },
    }),
    ScribbletunModule,
    MidiStoreModule,
  ],
  providers: [ScribbletunDocsResource, ClipGeneratorTool, ProgressionTool],
})
export class ScribbletuneMcpModule {}
