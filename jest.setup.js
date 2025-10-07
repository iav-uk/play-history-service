const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const baseDir = fs.existsSync(path.resolve(__dirname, "src")) ? "src" : "dist";

// Dynamically import the right modules based on the environment
const { loadEnv } = require(path.resolve(__dirname, `${baseDir}/config/envLoader`));
const { initDB, closeDB } = require(path.resolve(__dirname, `${baseDir}/db/pg`));

function resolveEnvFile() {
  const nodeEnv = process.env.NODE_ENV || "test";
  const isDocker = process.env.DOCKER_ENV === "true" || (process.env.HOSTNAME || "").includes("docker");

  let envFile = ".env.test";
  if (isDocker) envFile = ".env.docker";
  else if (nodeEnv === "development") envFile = ".env.local";

  // Since this file lives at the project root, point into src/config/
  const envPath = path.resolve(__dirname, "src/config", envFile);
  console.log(`[JEST ENV] Loaded ${envFile} from ${envPath}`);

  return envPath;
}

dotenv.config({ path: resolveEnvFile() });
loadEnv(); // ensures consistent config across app & DB

beforeAll(async () => {
  console.log("[JEST] Initializing database connection...");
  await initDB();
});

afterAll(async () => {
  console.log("[JEST] Closing database connection...");
  await closeDB();
});
