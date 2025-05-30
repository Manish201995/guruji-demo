import { IsOptional } from "class-validator";

export class AnswerDTO {
    @IsOptional()
    timestamp: string;

    @IsOptional()
    question: string
}