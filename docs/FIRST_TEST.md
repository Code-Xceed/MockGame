# First Backend Alpha Test Runbook

Date prepared: 2026-03-19

This runbook validates the current backend flow end-to-end:
1. register players
2. login
3. join matchmaking queue
4. start battle
5. finish battle with scores
6. verify leaderboard and match history

## Prerequisites

- Node.js 22+
- Corepack enabled: `corepack enable`
- PostgreSQL running and reachable
- Redis running and reachable

If Docker is available on your machine:

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
```

## 1) Setup Environment

Create `.env` from `.env.example` and verify:

- `DATABASE_URL=postgresql://mockgame:mockgame@localhost:5432/mockgame`
- `REDIS_URL=redis://localhost:6379`
- `JWT_SECRET=change-me`

## 2) Install + Generate + Migrate + Seed

```bash
corepack pnpm install
corepack pnpm db:generate
corepack pnpm --filter @mockgame/api db:migrate:dev
corepack pnpm --filter @mockgame/api db:seed
```

## 3) Start API

```bash
corepack pnpm --filter @mockgame/api dev
```

API base: `http://localhost:4000/api`

## 3.1) Start Web Test Console (Optional, Recommended)

```bash
corepack pnpm --filter @mockgame/web dev
```

Open: `http://localhost:3000/test-console`

## 4) Test Flow (PowerShell)

```powershell
$base = 'http://localhost:4000/api'

# Login seeded users
$p1Login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body (@{
  email = 'player1@mockgame.dev'
  password = 'Player@123'
} | ConvertTo-Json)

$p2Login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body (@{
  email = 'player2@mockgame.dev'
  password = 'Player@123'
} | ConvertTo-Json)

$p1Headers = @{ Authorization = "Bearer $($p1Login.accessToken)" }
$p2Headers = @{ Authorization = "Bearer $($p2Login.accessToken)" }

# Join same exam track queue
$p1Join = Invoke-RestMethod -Method Post -Uri "$base/matchmaking/queue/join" -Headers $p1Headers -ContentType 'application/json' -Body '{"examTrack":"JEE_MAIN"}'
$p2Join = Invoke-RestMethod -Method Post -Uri "$base/matchmaking/queue/join" -Headers $p2Headers -ContentType 'application/json' -Body '{"examTrack":"JEE_MAIN"}'

# Determine match ID from whichever join call returns MATCH_FOUND
$matchId = $null
if ($p1Join.status -eq 'MATCH_FOUND') { $matchId = $p1Join.match.id }
if ($p2Join.status -eq 'MATCH_FOUND') { $matchId = $p2Join.match.id }

if (-not $matchId) { throw 'No match found. Retry queue join.' }

# Start and finish battle
$start = Invoke-RestMethod -Method Post -Uri "$base/battles/$matchId/start" -Headers $p1Headers -ContentType 'application/json' -Body '{"clientVersion":"alpha-0.1"}'
$finish = Invoke-RestMethod -Method Post -Uri "$base/battles/$matchId/finish" -Headers $p1Headers -ContentType 'application/json' -Body '{"playerAScore":3,"playerBScore":1,"durationSeconds":180}'

# Read battle/match/leaderboard
$battleDetail = Invoke-RestMethod -Method Get -Uri "$base/battles/$matchId" -Headers $p1Headers
$matches = Invoke-RestMethod -Method Get -Uri "$base/matches" -Headers $p1Headers
$leaderboard = Invoke-RestMethod -Method Get -Uri "$base/leaderboard/top?examTrack=JEE_MAIN" -Headers $p1Headers

$finish
$battleDetail
$matches
$leaderboard | Select-Object -First 5
```

## Expected Outcome

- One queue join returns `MATCH_FOUND`
- Battle status moves to `ACTIVE` on start
- Battle status becomes `COMPLETED` on finish
- Winner receives positive MMR delta; loser negative delta
- Leaderboard reflects updated ratings
