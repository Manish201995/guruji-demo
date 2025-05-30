import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AnswersService } from './answer.service';
import { AnswerDTO } from './answer.dto';

@Controller('answers')
export class AnswersController {
  private readonly logger = new Logger(AnswersController.name);

  constructor(private readonly answersService: AnswersService) {}

  @Post('')
    async getAnswer(@Body() body: AnswerDTO) {
        return await this.answersService.getAnswer(body);
    }
}
