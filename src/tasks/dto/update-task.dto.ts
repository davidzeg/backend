import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriority, TaskStatus, UpdateTaskRequest } from 'shared-types';

export class UpdateTaskDto implements UpdateTaskRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  title?: string | undefined;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @IsOptional()
  description?: string | undefined;

  @IsEnum(['todo', 'in-progress', 'review', 'done'])
  @IsOptional()
  status?: TaskStatus | undefined;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: TaskPriority | undefined;

  @IsUUID()
  @IsOptional()
  asigneeId?: string | undefined;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] | undefined;

  @IsDateString()
  @IsOptional()
  dueDate?: Date | undefined;

  @IsNumber()
  version: number;
}
