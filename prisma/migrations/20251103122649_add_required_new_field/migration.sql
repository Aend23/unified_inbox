/*
  Warnings:

  - You are about to drop the column `expires` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Session_sessionToken_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expires",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "sessionToken" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
