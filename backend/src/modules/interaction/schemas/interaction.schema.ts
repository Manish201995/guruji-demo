/**
 * Schema definition for Interaction documents in MongoDB
 */

import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema} from 'mongoose';

export type InteractionDocument = Interaction & Document;

export enum InteractionType {
    ANSWER = 'answer',
    HINT_REQUEST = 'hint_request',
    REWATCH = 'rewatch',
    SKIP = 'skip'
}

@Schema({timestamps: true})
export class Interaction {
    _id?: string;
    @Prop({required: true, index: true})
    userId: string;

    @Prop({required: true, index: true})
    videoId: string;

    @Prop({required: true, index: true})
    questionId: string;

    @Prop({required: true, enum: Object.values(InteractionType)})
    type: InteractionType;

    @Prop({type: MongooseSchema.Types.Mixed})
    data: {
        answer?: string | number;
        correct?: boolean;
        rewatchTimestamp?: number;
        timeSpent?: number;
    };

    @Prop()
    videoTimestamp: number;

    @Prop({default: Date.now})
    interactionTime: Date;
}

export const InteractionSchema = SchemaFactory.createForClass(Interaction);

// Create compound indexes for common queries
InteractionSchema.index({userId: 1, videoId: 1});
InteractionSchema.index({questionId: 1, type: 1});
