/*
  Warnings:

  - A unique constraint covering the columns `[rideId,reviewerId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_rideId_reviewerId_key" ON "Review"("rideId", "reviewerId");
