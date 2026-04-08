-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('ACTIVE', 'FULL', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS');

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "status" "RideStatus" NOT NULL DEFAULT 'ACTIVE';
