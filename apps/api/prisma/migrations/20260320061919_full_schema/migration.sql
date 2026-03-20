-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('PHYSICS', 'CHEMISTRY', 'MATHEMATICS');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "playerAScore" INTEGER,
ADD COLUMN     "playerBScore" INTEGER,
ADD COLUMN     "winnerId" TEXT;

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examTrack" "ExamTrack" NOT NULL,
    "subject" "Subject" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "body" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "playerAAnswer" TEXT,
    "playerBAnswer" TEXT,
    "playerACorrect" BOOLEAN,
    "playerBCorrect" BOOLEAN,
    "playerATimeMs" INTEGER,
    "playerBTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_examTrack_subject_difficulty_idx" ON "Question"("examTrack", "subject", "difficulty");

-- CreateIndex
CREATE INDEX "Question_isActive_examTrack_idx" ON "Question"("isActive", "examTrack");

-- CreateIndex
CREATE INDEX "Round_matchId_idx" ON "Round"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_matchId_roundNumber_key" ON "Round"("matchId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "Match_playerAId_createdAt_idx" ON "Match"("playerAId", "createdAt");

-- CreateIndex
CREATE INDEX "Match_playerBId_createdAt_idx" ON "Match"("playerBId", "createdAt");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
