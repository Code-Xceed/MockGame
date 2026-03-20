# API (Current Baseline)

Base URL: `http://localhost:4000/api`

## Health

- `GET /health`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)

## Profile

- `GET /profile/me` (Bearer token)
- `PATCH /profile/me` (Bearer token)

## Matchmaking

- `POST /matchmaking/queue/join` (Bearer token)
- `POST /matchmaking/queue/leave` (Bearer token)
- `GET /matchmaking/queue/status` (Bearer token)

## Battles

- `POST /battles/:matchId/start` (Bearer token)
- `POST /battles/:matchId/finish` (Bearer token)
- `GET /battles/:matchId` (Bearer token)

## Matches

- `GET /matches` (Bearer token)
- `GET /matches/:matchId` (Bearer token)

## Leaderboard

- `GET /leaderboard/top?examTrack=JEE_MAIN` (Bearer token)

## Example Register Payload

```json
{
  "email": "player@mockgame.dev",
  "password": "Player@123",
  "displayName": "Player",
  "examTrack": "JEE_MAIN",
  "timezone": "Asia/Kolkata",
  "region": "IN"
}
```

## Example Queue Join Payload

```json
{
  "examTrack": "JEE_MAIN"
}
```
