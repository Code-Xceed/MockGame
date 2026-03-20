-- Initial schema migration for MockGame API
-- Generated from prisma/schema.prisma

CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'MODERATOR', 'ADMIN');
CREATE TYPE "ExamTrack" AS ENUM ('JEE_MAIN', 'JEE_ADVANCED', 'BITSAT');
CREATE TYPE "MatchStatus" AS ENUM ('FOUND', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
  "examTrack" "ExamTrack" NOT NULL DEFAULT 'JEE_MAIN',
  "timezone" TEXT,
  "region" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rating" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examTrack" "ExamTrack" NOT NULL,
  "hiddenMmr" INTEGER NOT NULL DEFAULT 1200,
  "visibleTier" TEXT NOT NULL DEFAULT 'Bronze',
  "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "examTrack" "ExamTrack" NOT NULL,
  "status" "MatchStatus" NOT NULL DEFAULT 'FOUND',
  "playerAId" TEXT NOT NULL,
  "playerBId" TEXT NOT NULL,
  "playerAMmrBefore" INTEGER NOT NULL,
  "playerBMmrBefore" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Rating_userId_examTrack_key" ON "Rating"("userId", "examTrack");
CREATE INDEX "Rating_examTrack_hiddenMmr_idx" ON "Rating"("examTrack", "hiddenMmr");
CREATE INDEX "Match_examTrack_status_createdAt_idx" ON "Match"("examTrack", "status", "createdAt");

ALTER TABLE "Rating"
  ADD CONSTRAINT "Rating_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_playerAId_fkey"
  FOREIGN KEY ("playerAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_playerBId_fkey"
  FOREIGN KEY ("playerBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
