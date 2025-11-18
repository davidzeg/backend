import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  Task as ITask,
  PaginatedResponse,
  TaskFilters,
  TaskListResponse,
} from 'shared-types';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<ITask> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      createdById: userId,
      lastModifiedById: userId,
      tags: createTaskDto.tags || [],
      status: 'todo',
    });

    const savedTask = await this.tasksRepository.save(task);

    // Emit real-time event
    this.eventsGateway.emitTaskCreated(savedTask);

    return savedTask;
  }

  async findAll(filters: TaskFilters): Promise<PaginatedResponse<ITask>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      priority,
      asigneeId,
      projectId,
      search,
      tags,
    } = filters;

    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.asignee', 'asignee')
      .leftJoinAndSelect('task.createdBy', 'createdBy');

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (asigneeId) {
      queryBuilder.andWhere('task.asigneeId = :asigneeId', { asigneeId });
    }

    if (projectId) {
      queryBuilder.where('task.projectId = :projectId', { projectId });
    }

    if (search) {
      queryBuilder.andWhere(
        'task.title ILIKE :search OR task.description ILIKE :search',
        { search: `%${search}%` },
      );
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('task.tags && :tags', { tags });
    }

    queryBuilder.orderBy(
      `task.${sortBy}`,
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    );

    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      data: tasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<ITask> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['asignee', 'createdBy', 'project'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<ITask> {
    const task = await this.findOne(id);

    // Optimistic locking check
    if (task.version !== updateTaskDto.version) {
      throw new ConflictException(
        `Task has been modified by another user. Expected version ${updateTaskDto.version}, but current version is ${task.version}`,
      );
    }

    // Update fields
    Object.assign(task, {
      ...updateTaskDto,
      lastModifiedById: userId,
    });

    const updatedTask = await this.tasksRepository.save(task);

    // Emit real-time event with changed fields
    const changedFields = Object.keys(updateTaskDto).filter(
      (key) => key !== 'version',
    );
    this.eventsGateway.emitTaskUpdated(updatedTask, changedFields);

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.delete(id);

    // Emit real-time event
    this.eventsGateway.emitTaskDeleted(id);
  }

  async findByAsignee(asigneeId: string): Promise<ITask[]> {
    return this.tasksRepository.find({
      where: { asigneeId: asigneeId },
      relations: ['asignee', 'createdBy', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProject(projectId: string): Promise<ITask[]> {
    return this.tasksRepository.find({
      where: { projectId },
      relations: ['asignee', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
