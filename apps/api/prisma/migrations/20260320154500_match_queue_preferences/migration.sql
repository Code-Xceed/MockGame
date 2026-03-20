-- AlterTable
ALTER TABLE "Match"
ADD COLUMN "preferredSubject" "Subject",
ADD COLUMN "preferredDifficulty" "Difficulty",
ADD COLUMN "roundTimeSeconds" INTEGER NOT NULL DEFAULT 45;
