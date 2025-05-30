import { IsOptional } from "class-validator";

export class DoubtDTO {
    @IsOptional()
    question: string;

    @IsOptional()
    answer: string;

    @IsOptional()
    videoId: string;

    @IsOptional()
    userId: string
}

export class GetDoubtDTO {
    @IsOptional()
    videoId: string;

    @IsOptional()
    userId: string
}
