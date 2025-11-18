import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Task as ITask } from 'shared-types';
import type { TaskPriority, TaskStatus } from 'shared-types';
import { User } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

@Entity('tasks')
@Index(['projectId', 'status'])
@Index(['asigneeId', 'status'])
export class Task implements ITask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo',
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  priority: TaskPriority;

  @Column('uuid', { nullable: true })
  asigneeId?: string;

  @Column('uuid')
  projectId: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column('uuid')
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @Column('uuid')
  lastModifiedById: string;

  @ManyToOne(() => User, (user) => user.assignedTasks, { eager: true })
  @JoinColumn({ name: 'asigneeId' })
  asignee?: User;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => Project, (project) => project.tasks)
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
