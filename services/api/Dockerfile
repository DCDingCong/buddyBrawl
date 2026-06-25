FROM node:22-alpine

WORKDIR /app

RUN corepack enable

RUN apk add --no-cache openssl

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY services/api/package.json services/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/configs/package.json packages/configs/package.json
COPY packages/battle/package.json packages/battle/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @buddy-brawl/api prisma:generate

WORKDIR /app/services/api

EXPOSE 3000

CMD ["pnpm", "dev"]
