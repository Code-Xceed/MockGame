import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private connected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? '';

    if (!redisUrl || redisUrl.includes('YOUR_UPSTASH')) {
      this.logger.warn(
        'REDIS_URL not configured. Matchmaking queue will use in-memory fallback. ' +
        'Set up free Redis at https://upstash.com',
      );
      // Create a dummy client that won't actually connect
      this.client = null as unknown as Redis;
      return;
    }

    // Upstash uses TLS (rediss://) — ioredis handles this automatically
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      enableOfflineQueue: true,
      // Upstash requires TLS — ioredis detects "rediss://" automatically
      ...(redisUrl.startsWith('rediss://') && {
        tls: { rejectUnauthorized: false },
      }),
    });
  }

  async onModuleInit() {
    if (!this.client) return;
    try {
      await this.client.ping();
      this.connected = true;
      this.logger.log('✅ Connected to Redis (Upstash)');
    } catch (err) {
      this.logger.warn(`Redis connection failed: ${err}. Matchmaking will use in-memory fallback.`);
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
