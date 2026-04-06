import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigType } from '@nestjs/config';
import type { Response } from 'express';
import { ClipsService } from './clips.service';
import { SaveClipResponseDto } from './clips.dto';
import { redisConfig } from '../config/redis.config';

@ApiTags('clips')
@Controller('clips')
export class ClipsController {
  constructor(
    private readonly clips: ClipsService,
    @Inject(redisConfig.KEY) private readonly cfg: ConfigType<typeof redisConfig>,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Store a MIDI clip' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'MIDI binary file' },
      },
    },
  })
  @ApiResponse({ status: 201, type: SaveClipResponseDto })
  async save(@UploadedFile() file: Express.Multer.File): Promise<SaveClipResponseDto> {
    const { id, key } = await this.clips.save(file.buffer);
    const downloadUrl = `${this.cfg.publicUrl}/clips/${id}`;
    return { key, downloadUrl, ttlSeconds: this.cfg.ttlSeconds };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Download a MIDI clip' })
  @ApiParam({ name: 'id', description: 'Clip UUID returned from POST /clips' })
  @ApiResponse({ status: 200, description: 'MIDI binary stream' })
  async fetch(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const buffer = await this.clips.fetchById(id);
    res.set({
      'Content-Type': 'audio/midi',
      'Content-Disposition': 'attachment; filename="clip.mid"',
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a MIDI clip' })
  @ApiParam({ name: 'id', description: 'Clip UUID returned from POST /clips' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.clips.deleteById(id);
  }
}
