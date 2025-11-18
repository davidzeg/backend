import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { CreateProjectRequest } from 'shared-types';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(
    createProjectDto: CreateProjectRequest,
    userId: string,
  ): Promise<Project> {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      ownerId: userId,
      memberIds: createProjectDto.memberIds || [userId],
    });

    return this.projectsRepository.save(project);
  }

  async findAll(userId: string): Promise<Project[]> {
    return this.projectsRepository
      .createQueryBuilder('project')
      .where('project.ownerId = :userId', { userId })
      .orWhere(':userId = ANY(project.memberIds)', { userId })
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['owner', 'tasks'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateData: Partial<Project>,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);
    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can edit this project',
      );
    }
    Object.assign(project, updateData);
    return this.projectsRepository.save(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can delete this project',
      );
    }
    await this.projectsRepository.remove(project);
  }
}
