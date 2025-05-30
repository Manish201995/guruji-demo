import { Body, Controller, Get, Param, Post, Put, Delete } from '@nestjs/common';
import { ChunkService } from './chunk.service';
import { Chunk } from './schemas/chunk.schema';

@Controller('chunks')
export class ChunkController {
  constructor(private chunks: ChunkService) {}

  /** GET /api/chunks/videos/:videoId */
  @Get('videos/:videoId')
  list(@Param('videoId') vid: string): Promise<Chunk[]> {
    return this.chunks['chunkModel'].find({ videoId: vid }).lean();
  }

  /** POST /api/chunks  – manual insert */
  @Post()
  create(@Body() data: Partial<Chunk>) {
    return this.chunks['chunkModel'].create(data);
  }

  /** PUT /api/chunks/:id */
  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Chunk>) {
    return this.chunks['chunkModel'].findByIdAndUpdate(id, data, { new: true });
  }

  /** DELETE /api/chunks/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chunks['chunkModel'].findByIdAndDelete(id);
  }

  
  
  
}
