import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { DoubtDTO, GetDoubtDTO } from './doubt.dto';
import { DoubtService } from './doubt.service';

@Controller('doubts')
export class DoubtsController {
  private readonly logger = new Logger(DoubtsController.name);

  constructor(private readonly doubtService: DoubtService) {}

  @Post('')
    async saveDoubt(@Body() body: DoubtDTO) {
        return await this.doubtService.saveDoubt(body);
    }

      @Get('')
    async getDoubts(@Query() query: GetDoubtDTO) {
        return await this.doubtService.getDoubts(query);
    }


      @Get('/notes')
    async getNotes(@Query() query: GetDoubtDTO) {
        return await this.doubtService.getNotes(query);
    }
}
