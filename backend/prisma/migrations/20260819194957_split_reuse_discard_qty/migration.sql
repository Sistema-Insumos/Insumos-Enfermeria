/*
  Warnings:

  - You are about to drop the column `postClassAction` on the `ConsumptionRecord` table. All the data in the column will be lost.
  - You are about to drop the column `reuseQty` on the `ConsumptionRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConsumptionRecord" DROP COLUMN "postClassAction",
DROP COLUMN "reuseQty",
ADD COLUMN     "discardedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "reusedQty" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "PostClassAction";
