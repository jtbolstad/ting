-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetPasswordToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetPasswordExpiresAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");
