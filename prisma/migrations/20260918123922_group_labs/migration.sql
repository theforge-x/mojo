-- CreateEnum
CREATE TYPE "GroupLabStatus" AS ENUM ('open', 'locked', 'cancelled');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "groupSize" INTEGER;

-- CreateTable
CREATE TABLE "group_labs" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "status" "GroupLabStatus" NOT NULL DEFAULT 'open',
    "lockedSize" INTEGER,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_labs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_labs_tutorId_status_idx" ON "group_labs"("tutorId", "status");

-- CreateIndex
CREATE INDEX "sessions_groupId_idx" ON "sessions"("groupId");

-- AddForeignKey
ALTER TABLE "group_labs" ADD CONSTRAINT "group_labs_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
