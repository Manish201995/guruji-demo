
import { Module } from '@nestjs/common';
import { DoubtsController } from './doubt.controller';
import { DoubtService } from './doubt.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Doubts, DoubtsSchema } from './doubt.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
          { name: Doubts.name, schema: DoubtsSchema }
        ]),
      ],
    controllers: [DoubtsController],
    providers: [DoubtService],
    exports: [DoubtService],
})
export class DoubtsModule {}
