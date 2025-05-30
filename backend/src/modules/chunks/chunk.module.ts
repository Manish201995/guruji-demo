// src/modules/chunk/chunk.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Chunk, ChunkSchema } from "./schemas/chunk.schema";
import { ChunkService } from "./chunk.service";
import { ChunkController } from "./chunk.controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: Chunk.name, schema: ChunkSchema }])],
  controllers: [ChunkController],
  providers: [ChunkService],
  exports: [ChunkService],
})
export class ChunkModule {}
