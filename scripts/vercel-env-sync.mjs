import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI terminal colors for premium experience
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

console.log(`
${colors.magenta}${colors.bright}======================================================
  🌌  Y E E T C O D E   E N V   S Y N C H R O N I Z E R (⚡)
======================================================${colors.reset}
`);

const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  console.error(`${colors.red}❌ Error: .env.local file not found at ${envPath}${colors.reset}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

const skipKeys = [
  'VERCEL_TOKEN',
  'GOOGLE_APPLICATION_CREDENTIALS',
];

const varsToSync = [];

for (let line of lines) {
  line = line.trim();
  // Skip comments and empty lines
  if (!line || line.startsWith('#')) continue;

  const match = line.match(/^([^=]+)=(.*)$/);
  if (!match) continue;

  const key = match[1].trim();
  let value = match[2].trim();

  // Strip surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  // Skip if key should be skipped or value is empty
  if (skipKeys.includes(key) || !value) {
    continue;
  }

  varsToSync.push({ key, value });
}

console.log(`${colors.cyan}🔍 Found ${colors.bright}${varsToSync.length}${colors.reset} environment variables to synchronize...`);
console.log(`${colors.dim}Running synchronization with 15-second safety timeouts and concurrency limit of 4...\n${colors.reset}`);

// Run a command as a promise with instant-kill once the save is confirmed
function runVercelCmd(args) {
  return new Promise((resolve) => {
    const proc = spawn('vercel', args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    let resolved = false;

    // 15-second safety timeout
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGKILL');
        resolve({ code: -1, stdout: stdout.trim(), stderr: (stderr.trim() + '\n[TIMEOUT: Command hung]').trim() });
      }
    }, 15000);

    const checkSuccess = (data) => {
      const text = data.toString();
      if (text.includes('Added Environment Variable') || text.includes('Overrode Environment Variable') || text.includes('Removed Environment Variable')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          // Kill the process immediately to avoid background update/telemetry hangs!
          proc.kill('SIGKILL');
          resolve({ code: 0, stdout: stdout.trim() + '\n' + text.trim(), stderr: stderr.trim() });
        }
      }
    };

    proc.stdout.on('data', (data) => {
      stdout += data;
      checkSuccess(data);
    });
    proc.stderr.on('data', (data) => {
      stderr += data;
      checkSuccess(data);
    });

    proc.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
      }
    });
  });
}

// Sync a single variable to production, preview, and development
async function syncVar({ key, value }) {
  let success = true;
  let errors = [];

  for (const env of ['production', 'preview', 'development']) {
    const args = ['env', 'add', key, env];
    if (env === 'preview') {
      args.push('');
    }
    args.push('--value', value, '--force', '--yes');

    const result = await runVercelCmd(args);
    if (result.code !== 0) {
      success = false;
      errors.push(`${env}: ${result.stderr || result.stdout || 'Unknown error'}`);
    }
  }

  if (success) {
    console.log(`📡 Syncing ${colors.cyan}${key}${colors.reset}... ${colors.green}✅ Success${colors.reset}`);
  } else {
    console.log(`📡 Syncing ${colors.cyan}${key}${colors.reset}... ${colors.red}❌ Failed${colors.reset}`);
    console.error(`   ${colors.dim}Details: ${errors.join(' | ')}${colors.reset}`);
  }
}

// Concurrency pool helper
async function runWithConcurrency(items, fn, limit) {
  const executing = [];
  for (const item of items) {
    const p = fn(item).then(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
}

async function main() {
  const startTime = Date.now();
  await runWithConcurrency(varsToSync, syncVar, 4); // Sync 4 variables concurrently
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${colors.green}${colors.bright}🎉 Environment variable synchronization process completed in ${durationSec}s!${colors.reset}`);
  console.log(`${colors.cyan}⚡ To apply these environment variables, trigger a new production redeployment using:${colors.reset}`);
  console.log(`${colors.yellow}   vercel --prod --yes${colors.reset}\n`);
}

main().catch(err => {
  console.error(`${colors.red}Unexpected main execution error: ${err.message}${colors.reset}`);
});
