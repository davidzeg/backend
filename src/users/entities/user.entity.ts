import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from 'shared-types';
import type { UserRole } from 'shared-types';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Task } from 'src/tasks/entities/task.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['createdAt'])
export class User implements UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'manager', 'member'],
    default: 'member',
  })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.asignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, (task) => task.createdById)
  createdTasks: Task[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  @BeforeUpdate()
  async hasRefreshToken() {
    if (this.refreshToken && !this.refreshToken.startsWith('$2b$')) {
      this.refreshToken = await bcrypt.hash(this.refreshToken, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async validateRefreshToken(token: string): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }
    return bcrypt.compare(token, this.refreshToken);
  }

  async updateRefreshToken(token: string | undefined) {
    if (token) {
      this.refreshToken = await bcrypt.hash(token, 10);
    } else {
      this.refreshToken = undefined;
    }
  }
}
