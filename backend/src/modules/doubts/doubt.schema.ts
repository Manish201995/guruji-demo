import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type DoubtsDocument = Doubts & Document;

@Schema({ collection: "doubts", timestamps: true })
export class Doubts {
    _id?: string;

    @Prop({ required: true, index: true })
    videoId: string;

    @Prop({ required: true })
    question: string;

    @Prop({ required: true })
    answer: string;

    @Prop({ required: true })
    userId: string;
}

export const DoubtsSchema = SchemaFactory.createForClass(Doubts);

DoubtsSchema.index({ videoId: 1 });
DoubtsSchema.index({ userId: 1 });
DoubtsSchema.index({ userId: 1, videoId: 1 });
