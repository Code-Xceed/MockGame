import { Injectable, Logger } from '@nestjs/common';

/**
 * ClickHouse Analytics Ingestion Skeleton
 *
 * In production, connect to ClickHouse via HTTP interface and insert
 * analytics events for dashboards and reporting.
 *
 * Tables (planned):
 * - match_events: match lifecycle events
 * - question_analytics: answer rates, difficulty calibration
 * - player_sessions: login/logout tracking
 * - queue_metrics: queue times, wait durations
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  /** Insert an analytics row (stub — logs in dev) */
  async insert(table: string, row: Record<string, unknown>) {
    this.logger.debug(`[ANALYTICS] ${table}: ${JSON.stringify(row)}`);

    // TODO: In production, use ClickHouse HTTP interface:
    // const url = `${process.env.CLICKHOUSE_URL}/?query=INSERT INTO ${table} FORMAT JSONEachRow`;
    // await fetch(url, { method: 'POST', body: JSON.stringify(row) });
  }

  async trackMatchCompleted(data: {
    matchId: string;
    examTrack: string;
    winnerId: string | null;
    durationSeconds: number;
    playerAMmrBefore: number;
    playerBMmrBefore: number;
  }) {
    return this.insert('match_events', {
      ...data,
      event: 'match_completed',
      timestamp: new Date().toISOString(),
    });
  }

  async trackQuestionAnswered(data: {
    questionId: string;
    userId: string;
    correct: boolean;
    timeMs: number;
    matchId: string;
  }) {
    return this.insert('question_analytics', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  async trackQueueTime(data: {
    userId: string;
    examTrack: string;
    waitTimeMs: number;
    matched: boolean;
  }) {
    return this.insert('queue_metrics', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
