-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- Seed fixed rooms
INSERT INTO "Room" ("id", "name", "order") VALUES
  ('room-m101', 'M101', 0),
  ('room-m102', 'M102', 1),
  ('room-m103', 'M103', 2),
  ('room-m104', 'M104', 3),
  ('room-prestamos', 'PRESTAMOS', 4);

-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "location";
ALTER TABLE "Equipment" ADD COLUMN "roomId" TEXT NOT NULL DEFAULT 'room-m101';
ALTER TABLE "Equipment" ALTER COLUMN "roomId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
