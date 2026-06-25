-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "platformOpenId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "currentPetId" TEXT,
    "arenaScore" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "critRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentInstance" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "enhanceLevel" INTEGER NOT NULL DEFAULT 0,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdventureState" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "currentStageId" TEXT NOT NULL,
    "lastClaimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storedGold" INTEGER NOT NULL DEFAULT 0,
    "storedExp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdventureState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaState" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 1000,
    "dailyChallengeCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArenaState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleRecord" (
    "id" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "attackerPlayerId" TEXT NOT NULL,
    "defenderPlayerId" TEXT NOT NULL,
    "winnerSide" TEXT NOT NULL,
    "attackerSnapshot" JSONB NOT NULL,
    "defenderSnapshot" JSONB NOT NULL,
    "events" JSONB NOT NULL,
    "rewards" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskProgress" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "lastProgressAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "rewards" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_platformOpenId_key" ON "Player"("platformOpenId");

-- CreateIndex
CREATE INDEX "Pet_playerId_idx" ON "Pet"("playerId");

-- CreateIndex
CREATE INDEX "EquipmentInstance_playerId_idx" ON "EquipmentInstance"("playerId");

-- CreateIndex
CREATE INDEX "EquipmentInstance_playerId_isEquipped_idx" ON "EquipmentInstance"("playerId", "isEquipped");

-- CreateIndex
CREATE UNIQUE INDEX "AdventureState_playerId_key" ON "AdventureState"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaState_playerId_key" ON "ArenaState"("playerId");

-- CreateIndex
CREATE INDEX "ArenaState_score_idx" ON "ArenaState"("score");

-- CreateIndex
CREATE INDEX "BattleRecord_attackerPlayerId_idx" ON "BattleRecord"("attackerPlayerId");

-- CreateIndex
CREATE INDEX "BattleRecord_defenderPlayerId_idx" ON "BattleRecord"("defenderPlayerId");

-- CreateIndex
CREATE INDEX "BattleRecord_createdAt_idx" ON "BattleRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskProgress_playerId_taskId_key" ON "TaskProgress"("playerId", "taskId");

-- CreateIndex
CREATE INDEX "RewardLog_playerId_idx" ON "RewardLog"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardLog_source_sourceId_playerId_key" ON "RewardLog"("source", "sourceId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigVersion_version_key" ON "ConfigVersion"("version");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentInstance" ADD CONSTRAINT "EquipmentInstance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdventureState" ADD CONSTRAINT "AdventureState_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaState" ADD CONSTRAINT "ArenaState_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleRecord" ADD CONSTRAINT "BattleRecord_attackerPlayerId_fkey" FOREIGN KEY ("attackerPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleRecord" ADD CONSTRAINT "BattleRecord_defenderPlayerId_fkey" FOREIGN KEY ("defenderPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLog" ADD CONSTRAINT "RewardLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
