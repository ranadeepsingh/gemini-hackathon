import { Vercel } from '@vercel/sdk';
import { execSync } from 'child_process';
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

function printBanner() {
  console.log(`
${colors.magenta}${colors.bright}======================================================
     🌌  A N T I G R A V I T Y   V E R C E L   🌌
======================================================${colors.reset}
`);
}

// Robust helper to get the Vercel Token from process.env or .env.local
function getVercelToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^VERCEL_TOKEN=["']?([^"\s']+)["']?/m);
      if (match) return match[1];
    }
  } catch (e) {
    console.error(`${colors.yellow}⚠️ Warning: Error reading .env.local file: ${e.message}${colors.reset}`);
  }
  return null;
}

// Get git remote url and extract owner/repo name
function getGitRepo() {
  try {
    const url = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    // Handles git@github.com:owner/repo.git and https://github.com/owner/repo.git
    const match = url.match(/github\.com[/:]([^/]+)\/([^.]+)(?:\.git)?/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  } catch (e) {
    console.error(`${colors.yellow}⚠️ Warning: Failed to parse Git remote URL: ${e.message}${colors.reset}`);
  }
  return null;
}

async function main() {
  printBanner();

  console.log(`${colors.cyan}🔍 Detecting project configuration...${colors.reset}`);
  
  const token = getVercelToken();
  if (!token) {
    console.error(`
${colors.red}${colors.bright}❌ Error: Vercel Token not found!${colors.reset}
Please ensure that ${colors.cyan}VERCEL_TOKEN${colors.reset} is configured in your ${colors.bright}.env.local${colors.reset} file.
Get a token at: ${colors.blue}${colors.bright}https://vercel.com/account/tokens${colors.reset}
`);
    process.exit(1);
  }

  const gitRepo = getGitRepo();
  if (!gitRepo) {
    console.error(`
${colors.red}${colors.bright}❌ Error: No Git remote "origin" detected!${colors.reset}
Please ensure this local repository has a remote origin configured.
`);
    process.exit(1);
  }

  console.log(`📦 Remote Repository: ${colors.green}${colors.bright}${gitRepo}${colors.reset}`);

  // Initialize Vercel SDK
  const vercel = new Vercel({ bearerToken: token });
  const projectName = 'gemini-hackathon';

  let project;
  try {
    console.log(`${colors.cyan}🛰️  Checking for existing Vercel project "${projectName}"...${colors.reset}`);
    project = await vercel.projects.getProject({ idOrName: projectName });
    console.log(`${colors.green}✅ Found existing Vercel project: ${colors.bright}${project.name}${colors.reset}`);
  } catch (err) {
    // Project does not exist, let's create it
    console.log(`${colors.yellow}🚀 Project not found on Vercel. Provisioning new project "${projectName}"...${colors.reset}`);
    try {
      project = await vercel.projects.createProject({
        requestBody: {
          name: projectName,
          framework: 'nextjs',
          gitRepository: {
            type: 'github',
            repo: gitRepo,
          },
        },
      });
      console.log(`${colors.green}🎉 Successfully created Vercel project: ${colors.bright}${project.name}${colors.reset}`);
    } catch (createErr) {
      console.error(`
${colors.red}${colors.bright}❌ Error creating project on Vercel:${colors.reset}
${createErr.message || createErr}

${colors.yellow}${colors.bright}Troubleshooting Steps:${colors.reset}
1. Verify if the Vercel GitHub Integration is installed on your GitHub account/organization.
   Install it here: ${colors.blue}${colors.bright}https://vercel.com/docs/concepts/git/vercel-for-github${colors.reset}
2. Ensure your Vercel Token has write/admin access to create projects.
`);
      process.exit(1);
    }
  }

  // Trigger first deployment from main branch
  try {
    console.log(`\n${colors.cyan}⚡ Triggering production deployment for ${colors.bright}main${colors.cyan} branch...${colors.reset}`);
    const deployment = await vercel.deployments.createDeployment({
      requestBody: {
        name: projectName,
        target: 'production',
        gitSource: {
          type: 'github',
          repo: gitRepo,
          ref: 'main',
        },
      },
    });

    console.log(`
${colors.green}${colors.bright}🚀 Deployment Triggered Successfully!${colors.reset}

${colors.bright}Deployment Details:${colors.reset}
- ${colors.cyan}Project:${colors.reset}       ${projectName}
- ${colors.cyan}Deployment ID:${colors.reset} ${deployment.id}
- ${colors.cyan}URL:${colors.reset}           ${colors.blue}${colors.bright}https://${deployment.url}${colors.reset}
- ${colors.cyan}Dashboard:${colors.reset}     ${colors.blue}https://vercel.com/dashboard/projects/${projectName}${colors.reset}

${colors.dim}Vercel will build and launch your application shortly. Push any new commits to GitHub to trigger automatic preview and production builds!${colors.reset}
`);
  } catch (deployErr) {
    console.error(`
${colors.red}${colors.bright}❌ Error triggering deployment on Vercel:${colors.reset}
${deployErr.message || deployErr}
`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Unexpected execution error: ${err.message}${colors.reset}`);
});
