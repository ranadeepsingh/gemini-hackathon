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
         🌌  A N T I C O D E   V E R C E L   🌌
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

function readLinkedProject() {
  const projectPath = path.resolve('.vercel/project.json');
  if (!fs.existsSync(projectPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  } catch (e) {
    console.error(`${colors.yellow}⚠️ Warning: Failed to parse .vercel/project.json: ${e.message}${colors.reset}`);
    return null;
  }
}

function writeLinkedProject(linkedProject, projectName) {
  const projectPath = path.resolve('.vercel/project.json');
  const nextProject = { ...linkedProject, projectName };
  fs.writeFileSync(projectPath, `${JSON.stringify(nextProject)}\n`);
}

// Get git remote URL and extract GitHub owner/repo metadata.
function getGitRepo() {
  try {
    const url = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    // Handles git@github.com:owner/repo.git and https://github.com/owner/repo.git
    const match = url.match(/github\.com[/:]([^/]+)\/([^.]+)(?:\.git)?/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        fullName: `${match[1]}/${match[2]}`,
        remoteUrl: url,
      };
    }
  } catch (e) {
    console.error(`${colors.yellow}⚠️ Warning: Failed to parse Git remote URL: ${e.message}${colors.reset}`);
  }
  return null;
}

function getGitRef() {
  const branch = 'main';
  execSync(`git fetch origin ${branch} --quiet`, { stdio: 'ignore' });
  const sha = execSync(`git rev-parse origin/${branch}`, { encoding: 'utf8' }).trim();
  const message = execSync(`git log -1 --pretty=%s origin/${branch}`, { encoding: 'utf8' }).trim();
  const authorName = execSync(`git log -1 --pretty=%an origin/${branch}`, { encoding: 'utf8' }).trim();
  const authorEmail = execSync(`git log -1 --pretty=%ae origin/${branch}`, { encoding: 'utf8' }).trim();

  return {
    branch,
    sha,
    message,
    authorName,
    authorEmail,
    dirty: execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0,
  };
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

  console.log(`📦 Remote Repository: ${colors.green}${colors.bright}${gitRepo.fullName}${colors.reset}`);

  // Initialize Vercel SDK
  const vercel = new Vercel({ bearerToken: token });
  const linkedProject = readLinkedProject();
  const projectName = process.env.VERCEL_PROJECT_NAME || 'anticode';
  const teamId = process.env.VERCEL_TEAM_ID || linkedProject?.orgId;

  let project;
  try {
    if (linkedProject?.projectId) {
      console.log(`${colors.cyan}🛰️  Reusing linked Vercel project "${linkedProject.projectName}" (${linkedProject.projectId})...${colors.reset}`);
      const projects = await vercel.projects.getProjects({
        teamId,
        search: linkedProject.projectName,
        limit: '20',
      });
      project = projects.projects?.find((candidate) => candidate.id === linkedProject.projectId);

      if (!project) {
        const linkedProjects = await vercel.projects.getProjects({
          teamId,
          limit: '100',
        });
        project = linkedProjects.projects?.find((candidate) => candidate.id === linkedProject.projectId);
      }
    } else {
      console.log(`${colors.cyan}🛰️  Checking for existing Vercel project "${projectName}"...${colors.reset}`);
      const projects = await vercel.projects.getProjects({
        teamId,
        search: projectName,
        limit: '20',
      });
      project = projects.projects?.find((candidate) => candidate.name === projectName);
    }

    if (!project) throw new Error('Project not found');

    if (project.name !== projectName) {
      console.log(`${colors.cyan}✏️  Renaming Vercel project "${project.name}" to "${projectName}"...${colors.reset}`);
      project = await vercel.projects.updateProject({
        idOrName: project.id,
        teamId,
        requestBody: {
          name: projectName,
          framework: 'nextjs',
          rootDirectory: null,
          commandForIgnoringBuildStep: null,
        },
      });
      if (linkedProject?.projectId) writeLinkedProject(linkedProject, projectName);
    }

    console.log(`${colors.green}✅ Using Vercel project: ${colors.bright}${project.name}${colors.reset}`);
  } catch (err) {
    // Project does not exist, let's create it
    console.log(`${colors.yellow}🚀 Project not found on Vercel. Provisioning new project "${projectName}"...${colors.reset}`);
    try {
      project = await vercel.projects.createProject({
        teamId,
        requestBody: {
          name: projectName,
          framework: 'nextjs',
          gitRepository: {
            type: 'github',
            repo: gitRepo.fullName,
          },
          rootDirectory: null,
          commandForIgnoringBuildStep: null,
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
    const gitRef = getGitRef();
    console.log(`\n${colors.cyan}⚡ Triggering production deployment for ${colors.bright}${gitRef.branch}${colors.cyan} at ${colors.bright}${gitRef.sha.slice(0, 8)}${colors.reset}`);
    const deployment = await vercel.deployments.createDeployment({
      teamId,
      forceNew: '1',
      requestBody: {
        name: projectName,
        project: project.id,
        target: 'production',
        gitSource: {
          type: 'github',
          org: gitRepo.owner,
          repo: gitRepo.repo,
          ref: gitRef.branch,
          sha: gitRef.sha,
        },
        gitMetadata: {
          remoteUrl: gitRepo.remoteUrl,
          commitAuthorName: gitRef.authorName,
          commitAuthorEmail: gitRef.authorEmail,
          commitMessage: gitRef.message,
          commitRef: gitRef.branch,
          commitSha: gitRef.sha,
          dirty: gitRef.dirty,
        },
        projectSettings: {
          framework: 'nextjs',
          rootDirectory: null,
          commandForIgnoringBuildStep: null,
        },
      },
    });

    console.log(`
${colors.green}${colors.bright}🚀 Deployment Triggered Successfully!${colors.reset}

${colors.bright}Deployment Details:${colors.reset}
- ${colors.cyan}Project:${colors.reset}       ${projectName}
- ${colors.cyan}Deployment ID:${colors.reset} ${deployment.id}
- ${colors.cyan}Commit:${colors.reset}        ${gitRef.sha}
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
