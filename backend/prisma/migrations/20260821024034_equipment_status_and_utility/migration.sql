-- CreateEnum
CREATE TYPE "EquipmentUtility" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- Replace EquipmentStatus enum values (OPERATIVE/MAINTENANCE/OUT_OF_SERVICE -> GOOD/BAD)
ALTER TYPE "EquipmentStatus" RENAME TO "EquipmentStatus_old";
CREATE TYPE "EquipmentStatus" AS ENUM ('GOOD', 'BAD');
ALTER TABLE "Equipment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Equipment" ALTER COLUMN "status" TYPE "EquipmentStatus" USING ('GOOD'::text::"EquipmentStatus");
ALTER TABLE "Equipment" ALTER COLUMN "status" SET DEFAULT 'GOOD';
DROP TYPE "EquipmentStatus_old";

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN "utility" "EquipmentUtility" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Equipment" ALTER COLUMN "category" SET DEFAULT 'General';
