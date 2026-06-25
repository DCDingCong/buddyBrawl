import { buildApp } from "./app.js";
import { readEnv } from "./env.js";

async function start(): Promise<void> {
  const env = readEnv();
  const app = await buildApp();

  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.port
    });
  } catch (error) {
    app.log.error(error, "Failed to start API server");
    await app.close();
    process.exit(1);
  }
}

try {
  await start();
} catch (error) {
  console.error("Failed to initialize API server", error);
  process.exit(1);
}
