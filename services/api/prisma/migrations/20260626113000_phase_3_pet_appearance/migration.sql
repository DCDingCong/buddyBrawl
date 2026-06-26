ALTER TABLE "Pet"
ADD COLUMN "bodyProfile" JSONB NOT NULL DEFAULT '{"heightScale":1,"build":"balanced","headRatio":0.32,"posture":"steady","tag":"稳健"}',
ADD COLUMN "appearanceSlots" JSONB NOT NULL DEFAULT '{"head":"bamboo_leaf","facePattern":"sunny_eye","bodyPattern":"warm_stripe","back":null,"handheld":null}';
