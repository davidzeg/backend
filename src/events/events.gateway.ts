import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import {
  WSEvent,
  WSEventType,
  Task,
  UserPresence,
  TaskCreatedPayload,
  TaskUpdatedPayload,
  TaskDeletedPayload,
  UserJoinedPayload,
  TypingPayload,
} from 'shared-types';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userPresence: Map<string, UserPresence> = new Map();

  async handleConnection(client: Socket) {
    try {
      const user = (client as any).user;
      if (!user) {
        client.disconnect();
        return;
      }

      // Update user presence
      const presence: UserPresence = {
        userId: user.id,
        userName: user.name,
        avatarUrl: user.avatarUrl,
        isOnline: true,
        lastSeen: new Date(),
      };

      this.userPresence.set(user.id, presence);

      // Broadcast user joined
      const joinEvent: WSEvent<UserJoinedPayload> = {
        type: 'user-joined',
        payload: { user },
        timestamp: new Date(),
        userId: user.id,
      };

      this.server.emit('event', joinEvent);

      console.log(`Client connected: ${client.id}, User: ${user.email}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (user) {
      // Update presence
      const presence = this.userPresence.get(user.id);
      if (presence) {
        presence.isOnline = false;
        presence.lastSeen = new Date();
        this.userPresence.set(user.id, presence);
      }

      // Broadcast user left
      const leftEvent: WSEvent<{ userId: string }> = {
        type: 'user-left',
        payload: { userId: user.id },
        timestamp: new Date(),
        userId: user.id,
      };

      this.server.emit('event', leftEvent);

      console.log(`Client disconnected: ${client.id}, User: ${user.email}`);
    }
  }

  @SubscribeMessage('join-task')
  handleJoinTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const user = (client as any).user;
    client.join(`task:${data.taskId}`);

    // Update presence
    const presence = this.userPresence.get(user.id);
    if (presence) {
      presence.taskId = data.taskId;
      this.userPresence.set(user.id, presence);

      // Broadcast presence update to task room
      const event: WSEvent<UserPresence> = {
        type: 'presence-updated',
        payload: presence,
        timestamp: new Date(),
        userId: user.id,
      };

      this.server.to(`task:${data.taskId}`).emit('event', event);
    }
  }

  @SubscribeMessage('leave-task')
  handleLeaveTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const user = (client as any).user;
    client.leave(`task:${data.taskId}`);

    // Update presence
    const presence = this.userPresence.get(user.id);
    if (presence) {
      presence.taskId = undefined;
      this.userPresence.set(user.id, presence);

      // Broadcast presence update
      const event: WSEvent<UserPresence> = {
        type: 'presence-updated',
        payload: presence,
        timestamp: new Date(),
        userId: user.id,
      };

      this.server.to(`task:${data.taskId}`).emit('event', event);
    }
  }

  @SubscribeMessage('typing-started')
  handleTypingStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const user = (client as any).user;
    const event: WSEvent<TypingPayload> = {
      type: 'typing.started',
      payload: {
        userId: user.id,
        userName: user.name,
        taskId: data.taskId,
      },
      timestamp: new Date(),
      userId: user.id,
    };

    client.to(`task:${data.taskId}`).emit('event', event);
  }

  @SubscribeMessage('typing-stopped')
  handleTypingStopped(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const user = (client as any).user;
    const event: WSEvent<TypingPayload> = {
      type: 'typing.stopped',
      payload: {
        userId: user.id,
        userName: user.name,
        taskId: data.taskId,
      },
      timestamp: new Date(),
      userId: user.id,
    };

    client.to(`task:${data.taskId}`).emit('event', event);
  }

  emitTaskCreated(task: Task) {
    const event: WSEvent<TaskCreatedPayload> = {
      type: 'task-created',
      payload: { task },
      timestamp: new Date(),
      userId: task.createdById,
    };

    this.server.to(`project:${task.projectId}`).emit('event', event);
  }

  emitTaskUpdated(task: Task, updatedFields: string[]) {
    const event: WSEvent<TaskUpdatedPayload> = {
      type: 'task-updated',
      payload: { task, updatedFields },
      timestamp: new Date(),
      userId: task.lastModifiedById,
    };

    this.server.to(`task:${task.id}`).emit('event', event);
    this.server.to(`project:${task.projectId}`).emit('event', event);
  }

  emitTaskDeleted(taskId: string) {
    const event: WSEvent<TaskDeletedPayload> = {
      type: 'task-deleted',
      payload: { taskId },
      timestamp: new Date(),
      userId: 'system',
    };

    this.server.emit('event', event);
  }

  getOnlineUsers(): UserPresence[] {
    return Array.from(this.userPresence.values()).filter((p) => p.isOnline);
  }
}
