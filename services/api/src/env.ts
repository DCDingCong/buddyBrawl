export interface ApiEnv {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  configVersion: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function readPort(): number {
  const rawPort = process.env.PORT ?? "3000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value ${rawPort}`);
  }

  return port;
}

export function readEnv(): ApiEnv {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: readPort(),
    databaseUrl: requireEnv("DATABASE_URL"),
    jwtSecret: requireEnv("JWT_SECRET"),
    configVersion: process.env.CONFIG_VERSION ?? "phase-1"
  };
}
