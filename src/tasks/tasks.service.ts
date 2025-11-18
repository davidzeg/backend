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
import { Task as ITask, PaginatedResponse } from 'shared-types';
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

  async findAll(
    projectId?: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<ITask>> {
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.asignee', 'asignee')
      .leftJoinAndSelect('task.createdBy', 'createdBy');

    if (projectId) {
      queryBuilder.where('task.projectId = :projectId', { projectId });
    }

    const [tasks, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('task.createdAt', 'DESC')
      .getManyAndCount();

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
