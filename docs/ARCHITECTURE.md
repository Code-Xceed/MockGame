# MockGame Architecture Baseline

- Architecture style: modular monolith in early phase, service extraction later.
- Core runtime components: API, real-time gateway, queue/matchmaker, scoring/rating, analytics pipeline.
- Persistence: PostgreSQL for system of record, Redis for low-latency state, ClickHouse for analytics.
- Integrity: strict anti-cheat telemetry and moderation actions from day one.
