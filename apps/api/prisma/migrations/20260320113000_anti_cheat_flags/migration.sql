-- CreateEnum
CREATE TYPE "AntiCheatSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "AntiCheatFlag" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "severity" "AntiCheatSeverity" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AntiCheatFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AntiCheatFlag_matchId_createdAt_idx" ON "AntiCheatFlag"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "AntiCheatFlag_userId_createdAt_idx" ON "AntiCheatFlag"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AntiCheatFlag_severity_createdAt_idx" ON "AntiCheatFlag"("severity", "createdAt");

-- AddForeignKey
ALTER TABLE "AntiCheatFlag" ADD CONSTRAINT "AntiCheatFlag_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AntiCheatFlag" ADD CONSTRAINT "AntiCheatFlag_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
