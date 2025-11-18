import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateTaskRequest } from 'shared-types';
import type { TaskPriority } from 'shared-types';

export class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description?: string | undefined;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority: TaskPriority;

  @IsUUID()
  @IsOptional()
  asigneeId?: string | undefined;

  @IsUUID()
  projectId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] | undefined;

  @IsDateString()
  @IsOptional()
  dueDate?: Date | undefined;
}
