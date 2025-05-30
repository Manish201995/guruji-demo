// src/modules/chunk/schemas/chunk.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Chunk {
  @Prop({ required: true, index: true }) videoId: string;
  @Prop({ required: true }) idx: number;
  @Prop({ required: true }) startSec: number;
  @Prop({ required: true }) endSec: number;
  @Prop({ required: true }) text: string;
  @Prop({ type: [Number], default: [] }) vector: number[]; // AstraDB id
}

export const ChunkSchema = SchemaFactory.createForClass(Chunk);
