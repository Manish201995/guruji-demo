
import {Module, forwardRef} from '@nestjs/common';
import { AnswersController } from './answer.controller';
import { AnswersService } from './answer.service';

@Module({
  imports: [

  ],
  controllers: [AnswersController],
  providers: [AnswersService],
  exports: [AnswersService],
})
export class AnswersModule {}
