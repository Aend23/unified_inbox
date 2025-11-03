/*
  Warnings:

  - You are about to drop the column `providerAccountId` on the `Account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider,providerId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Account_provider_providerAccountId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "providerAccountId",
ADD COLUMN     "password" TEXT,
ADD COLUMN     "providerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerId_key" ON "Account"("provider", "providerId");
