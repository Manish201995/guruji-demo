// PATCH src/modules/chunk/chunk.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Chunk } from "./schemas/chunk.schema";

/* helper */
function cosine(a: number[], b: number[]) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (na * nb + 1e-9);
}

@Injectable()
export class ChunkService {
  constructor(@InjectModel(Chunk.name) private chunkModel: Model<Chunk>) {}

  findChunkByTime(videoId: string, sec: number) {
    return this.chunkModel.findOne({ videoId, startSec: { $lte: sec }, endSec: { $gte: sec } }).lean();
  }

  /** Quick JS-side cosine search (replace with Astra API later) */
  async similaritySearch(videoId: string, qVec: number[], k = 4) {
    const docs = await this.chunkModel.find({ videoId }).lean();
    const scored = docs
      .map((d) => ({ ...d, score: cosine(d.vector, qVec) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    return scored;
  }

  deleteChunksByVideoId(videoId: string) {
    return this.chunkModel.deleteMany({ videoId });
  }
}
