import { Injectable, Logger } from '@nestjs/common';

/**
 * Kafka Event Publishing Skeleton
 *
 * In production, connect to Kafka via KafkaJS and publish domain events
 * for analytics, notifications, and audit logging.
 *
 * Topics:
 * - mockgame.user.registered
 * - mockgame.match.created
 * - mockgame.match.completed
 * - mockgame.round.completed
 * - mockgame.rating.updated
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  /** Publish a domain event (stub — logs to console in dev) */
  async publish(topic: string, payload: Record<string, unknown>) {
    const event = {
      topic,
      timestamp: new Date().toISOString(),
      payload,
    };

    // In dev mode, just log events
    this.logger.debug(`[EVENT] ${topic}: ${JSON.stringify(payload)}`);

    // TODO: In production, connect KafkaJS producer and send:
    // await this.producer.send({
    //   topic,
    //   messages: [{ value: JSON.stringify(event) }],
    // });

    return event;
  }

  async publishMatchCreated(matchId: string, playerAId: string, playerBId: string, examTrack: string) {
    return this.publish('mockgame.match.created', { matchId, playerAId, playerBId, examTrack });
  }

  async publishMatchCompleted(matchId: string, winnerId: string | null, ratingDeltas: Record<string, number>) {
    return this.publish('mockgame.match.completed', { matchId, winnerId, ratingDeltas });
  }

  async publishUserRegistered(userId: string, email: string, examTrack: string) {
    return this.publish('mockgame.user.registered', { userId, email, examTrack });
  }

  async publishRatingUpdated(userId: string, examTrack: string, oldMmr: number, newMmr: number) {
    return this.publish('mockgame.rating.updated', { userId, examTrack, oldMmr, newMmr });
  }
}
