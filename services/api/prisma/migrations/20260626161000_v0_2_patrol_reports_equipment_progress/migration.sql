ALTER TABLE "EquipmentInstance"
ADD COLUMN "proficiency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "techniqueTriggerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastTechniqueTriggeredAt" TIMESTAMP(3);

CREATE TABLE "PatrolState" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "lastSettledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maxRewardMinutes" INTEGER NOT NULL DEFAULT 480,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatrolState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatrolEvent" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rewards" JSONB NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatrolEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BattleReportView" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "battleRecordId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleReportView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatrolState_playerId_key" ON "PatrolState"("playerId");
CREATE INDEX "PatrolEvent_playerId_happenedAt_idx" ON "PatrolEvent"("playerId", "happenedAt");
CREATE UNIQUE INDEX "BattleReportView_playerId_battleRecordId_key" ON "BattleReportView"("playerId", "battleRecordId");
CREATE INDEX "BattleReportView_playerId_viewedAt_idx" ON "BattleReportView"("playerId", "viewedAt");

ALTER TABLE "PatrolState" ADD CONSTRAINT "PatrolState_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PatrolEvent" ADD CONSTRAINT "PatrolEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BattleReportView" ADD CONSTRAINT "BattleReportView_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BattleReportView" ADD CONSTRAINT "BattleReportView_battleRecordId_fkey" FOREIGN KEY ("battleRecordId") REFERENCES "BattleRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
