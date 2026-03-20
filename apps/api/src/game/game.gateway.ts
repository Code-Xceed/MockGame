import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Game WebSocket Gateway
 *
 * Handles real-time communication for:
 * - Match lifecycle events (match_found, round_start, round_result, match_end)
 * - Queue status updates
 * - Player connection tracking
 *
 * Clients authenticate by sending their JWT in the `auth.token` handshake option.
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);

  /** userId -> many socket IDs (multi-tab/session safe) */
  private readonly userSockets = new Map<string, Set<string>>();
  /** socketId -> userId reverse lookup for disconnect cleanup */
  private readonly socketUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = await this.authenticateSocket(client);
    if (!userId) {
      this.logger.warn(`Unauthenticated socket: ${client.id}`);
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    this.socketUsers.set(client.id, userId);

    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(client.id);
    this.userSockets.set(userId, sockets);

    this.logger.log(`User connected: ${userId} (socket: ${client.id})`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      return;
    }

    this.socketUsers.delete(client.id);

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`User disconnected: ${userId} (socket: ${client.id})`);
  }

  @SubscribeMessage('join_match')
  async handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const userId = this.getSocketUserId(client);

    const participantMatch = await this.prisma.match.findFirst({
      where: {
        id: data.matchId,
        OR: [{ playerAId: userId }, { playerBId: userId }],
      },
      select: { id: true },
    });

    if (!participantMatch) {
      throw new WsException('You are not a participant of this match');
    }

    const room = `match:${data.matchId}`;
    void client.join(room);
    this.logger.log(`User ${userId} joined room ${room}`);
    return { event: 'joined_match', data: { matchId: data.matchId } };
  }

  @SubscribeMessage('submit_answer')
  handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; roundNumber: number; answer: string },
  ) {
    const userId = this.getSocketUserId(client);
    const room = `match:${data.matchId}`;
    // Broadcast answer acknowledgement to other participants in the room
    client.to(room).emit('opponent_answered', {
      roundNumber: data.roundNumber,
      userId,
    });

    this.logger.log(
      `Answer submitted by user ${userId} for match ${data.matchId} round ${data.roundNumber}`,
    );

    return { event: 'answer_received', data: { roundNumber: data.roundNumber } };
  }

  /** Emit to a specific user if online */
  emitToUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) {
      return;
    }

    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /** Emit to all participants in a match room */
  emitToMatch(matchId: string, event: string, data: unknown) {
    this.server.to(`match:${matchId}`).emit(event, data);
  }

  /** Check if a user is currently connected */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  private async authenticateSocket(client: Socket): Promise<string | null> {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) return null;

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });
      return payload.sub as string;
    } catch {
      return null;
    }
  }

  private getSocketUserId(client: Socket): string {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      throw new WsException('Unauthorized socket');
    }
    return userId;
  }
}
