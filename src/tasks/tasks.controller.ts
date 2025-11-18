import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  ApiResponse,
  PaginatedResponse,
  Task,
  UserResponse,
} from 'shared-types';
import { UpdateTaskDto } from './dto/update-task.dto';

interface AuthenticatedRequest {
  user: UserResponse;
}

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.create(createTaskDto, req.user.id);
    return {
      sucess: true,
      data: task,
      message: 'Task created successfully',
    };
  }

  @Get()
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe)
    pageSize?: number,
  ): Promise<ApiResponse<PaginatedResponse<Task>>> {
    const result = await this.tasksService.findAll(projectId, page, pageSize);
    return {
      sucess: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.findOne(id);
    return {
      sucess: true,
      data: task,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.update(id, updateTaskDto, req.user.id);
    return {
      sucess: true,
      data: task,
      message: 'Task updated successfully',
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.tasksService.remove(id);

    return {
      sucess: true,
      message: 'Task deleted successfully',
    };
  }

  @Get('asignee/:asigneeId')
  async findByAsignee(
    @Param('asigneeId', ParseUUIDPipe) asigneeId: string,
  ): Promise<ApiResponse<Task[]>> {
    const tasks = await this.tasksService.findByAsignee(asigneeId);
    return {
      sucess: true,
      data: tasks,
    };
  }
}
