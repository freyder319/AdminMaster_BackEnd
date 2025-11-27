import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ChatHistoryItemDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  text!: string;
}

export class SendMessageDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}


