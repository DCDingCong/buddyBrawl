-- AlterTable
ALTER TABLE "EquipmentInstance" ADD COLUMN "equippedSlot" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Player_currentPetId_key" ON "Player"("currentPetId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentInstance_playerId_equippedSlot_key" ON "EquipmentInstance"("playerId", "equippedSlot");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_currentPetId_fkey" FOREIGN KEY ("currentPetId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
