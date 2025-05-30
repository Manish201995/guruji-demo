/**
 * Interaction module for handling user interaction-related functionality
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { Interaction, InteractionSchema } from './schemas/interaction.schema';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interaction.name, schema: InteractionSchema }
    ]),
    QuestionModule,
  ],
  controllers: [InteractionController],
  providers: [InteractionService],
  exports: [InteractionService],
})
export class InteractionModule {}