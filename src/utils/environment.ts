// src/utils/environment.ts

import os from 'os';

export interface EnvironmentInfo {
  environment: 'Docker' | 'Local' | 'CI' | 'Unknown';
  dbHost: string;
  dbName: string;
  hostname: string;
  timestamp: string;
}

// detect runtime environment and connection details.
export function detectEnvironment(): EnvironmentInfo {
  const isDockerEnv = process.env.DOCKER_ENV === 'true';
  const isCI = !!process.env.CI;
  const hostname = os.hostname();

  let environment: EnvironmentInfo['environment'] = 'Unknown';
  if (isCI) environment = 'CI';
  else if (isDockerEnv || hostname.includes('docker')) environment = 'Docker';
  else environment = 'Local';

  return {
    environment,
    dbHost: process.env.DB_HOST || (isDockerEnv ? 'db' : 'localhost'),
    dbName: process.env.DB_NAME || 'play_history_service',
    hostname,
    timestamp: new Date().toISOString(),
  };
}
