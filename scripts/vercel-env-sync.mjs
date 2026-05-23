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
console.log(`${colors.dim}Running sequential synchronization with 30-second safety timeouts and automatic retries to guarantee 100% stable syncing...\n${colors.reset}`);

// Run a command as a promise with instant-kill once the save is confirmed
function runVercelCmd(args) {
  return new Promise((resolve) => {
    const proc = spawn('vercel', args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    let resolved = false;

    // 30-second safety timeout for robust network/API handshakes
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGKILL');
        resolve({ code: -1, stdout: stdout.trim(), stderr: (stderr.trim() + '\n[TIMEOUT: Command hung]').trim() });
      }
    }, 30000);

    const checkSuccess = () => {
      const accumulated = stdout + '\n' + stderr;
      if (
        accumulated.includes('Added Environment Variable') ||
        accumulated.includes('Overrode Environment Variable') ||
        accumulated.includes('Removed Environment Variable')
      ) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          // Kill the process immediately to avoid background update/telemetry hangs!
          proc.kill('SIGKILL');
          resolve({ code: 0, stdout: stdout.trim(), stderr: stderr.trim() });
        }
      }
    };

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      checkSuccess();
    });
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      checkSuccess();
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

// Sync a single variable to production, preview, and development with auto-retries
async function syncVar({ key, value }) {
  let success = true;
  let errors = [];

  for (const env of ['production', 'preview', 'development']) {
    let envSuccess = false;
    let envErrors = [];

    const args = ['env', 'add', key, env];
    if (env === 'preview') {
      args.push('');
    }
    args.push('--value', value, '--force', '--yes');

    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await runVercelCmd(args);
      if (result.code === 0) {
        envSuccess = true;
        break;
      } else {
        envErrors.push(`Attempt ${attempt}: ${result.stderr || result.stdout || 'Unknown error'}`);
        // Quick backoff wait of 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!envSuccess) {
      success = false;
      errors.push(`${env} failed after 3 attempts (${envErrors.join(' | ')})`);
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
  await runWithConcurrency(varsToSync, syncVar, 1); // Sync variables sequentially (limit 1)
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${colors.green}${colors.bright}🎉 Environment variable synchronization process completed in ${durationSec}s!${colors.reset}`);
  console.log(`${colors.cyan}⚡ To apply these environment variables, trigger a new production redeployment using:${colors.reset}`);
  console.log(`${colors.yellow}   vercel --prod --yes${colors.reset}\n`);
}

main().catch(err => {
  console.error(`${colors.red}Unexpected main execution error: ${err.message}${colors.reset}`);
});
