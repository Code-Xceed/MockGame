# MockGame

Competitive exam-prep battle platform with realtime matchmaking, round-based battles, anti-cheat signals, admin moderation, and leaderboard progression.

## Monorepo Structure

- `apps/api`: NestJS backend (Auth, Matchmaking, Battles, Matches, Admin APIs)
- `apps/web`: Student-facing web app (Play flow, Match UI, Profile, Leaderboard)
- `apps/admin`: Admin console (users, matches, questions, anti-cheat)
- `packages/config`: Shared TypeScript configs
- `packages/types`: Shared types package
- `packages/ui`: Shared UI package

## Core Architecture

- **Primary DB**: PostgreSQL via Prisma
- **Realtime Queue + Presence**: Redis + Socket.io events
- **Realtime Gameplay Updates**: WebSocket namespace `/game`
- **Durable Match State**: Postgres (`Match`, `Round`, `Rating`, `AntiCheatFlag`)

## Local Development

### 1) Install

```bash
corepack enable
corepack pnpm install
```

### 2) Environment

- Create `.env` from `.env.example` (API and DB credentials)
- Ensure PostgreSQL and Redis are running

### 3) Generate Prisma client

```bash
corepack pnpm --filter @mockgame/api db:generate
```

### 4) Run all apps

```bash
corepack pnpm dev
```

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:4000`

## Updated Play Flow

1. `/play`: User selects queue settings (exam, category, difficulty, round timer) and joins queue.
2. Matchmaking finds compatible opponent (MMR + settings compatibility).
3. `/play/found/:id`: Found lobby shows match settings and opponent details.
4. User can start or cancel before battle start.
5. `/play/live/:id`: Active battle screen with round timer, answer submission, live updates.
6. If either player quits active battle, both players receive realtime event and are redirected to `/play`; match is cancelled and partial round data is cleared.

## Quality Commands

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```
