import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const PROBLEM_IDS = {
  matrixOptimizer: '00000000-0000-0000-0000-000000000001',
  logParser: '00000000-0000-0000-0000-000000000002',
  promptDefense: '00000000-0000-0000-0000-000000000003',
  dependencyResolver: '00000000-0000-0000-0000-000000000004',
  backendIoService: '00000000-0000-0000-0000-000000000010',
};

function deterministicUuid(label) {
  const hex = crypto.createHash('sha256').update(label).digest('hex');
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function daysAgoDate(daysAgo) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function daysAgoTimestamp(daysAgo, hour = 16) {
  const date = new Date(`${daysAgoDate(daysAgo)}T${String(hour).padStart(2, '0')}:00:00.000Z`);
  return date.toISOString();
}

function buildProfilePayload(authUserId, metadata) {
  return {
    id: authUserId,
    username: metadata.username,
    full_name: metadata.full_name,
    avatar_url: metadata.avatar_url ?? null,
    role: metadata.role,
    updated_at: new Date().toISOString()
  };
}

function getEnvVar(envContent, varName) {
  const match = envContent.match(new RegExp(`^${varName}=["']?([^"\\s']+)["']?`, 'm'));
  return match ? match[1] : null;
}

async function syncProfile(supabase, authUser, metadata) {
  const { error } = await supabase
    .from('profiles')
    .upsert(buildProfilePayload(authUser.id, metadata), { onConflict: 'id' });

  if (error) {
    console.error(`${colors.red}❌ Error syncing profile for ${authUser.email}: ${error.message}${colors.reset}`);
    return false;
  }

  console.log(`${colors.green}✅ Profile row synchronized successfully.${colors.reset}`);
  return true;
}

async function seedDailyChallenge(supabase) {
  const { error } = await supabase
    .from('daily_challenges')
    .upsert({
      challenge_date: daysAgoDate(0),
      problem_id: PROBLEM_IDS.backendIoService,
      spotlight_label: 'Daily Backend Contract Drill',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'challenge_date' });

  if (error) {
    console.error(`${colors.red}❌ Error seeding daily challenge: ${error.message}${colors.reset}`);
    return false;
  }

  console.log(`${colors.green}✅ Daily challenge row synchronized successfully.${colors.reset}`);
  return true;
}

function buildSeedSessions(authUser, metadata) {
  const email = authUser.email || metadata.username;
  const common = {
    candidate_id: authUser.id,
    session_type: metadata.role === 'interviewer' ? 'live_interview' : 'practice',
    gce_instance_zone: 'us-central1-a',
  };

  if (metadata.role === 'interviewer') {
    return [
      {
        seedKey: 'interviewer-review-completed',
        problem_id: PROBLEM_IDS.logParser,
        status: 'completed',
        createdDaysAgo: 1,
        duration_seconds: 1980,
        agent_deploy_count: 2,
        test_run_count: 4,
        compile_error_count: 0,
        total_llm_calls: 7,
        total_input_tokens: 39200,
        total_output_tokens: 9100,
        total_reasoning_tokens: 6600,
        cost_usd: 0.64,
        score: 92,
        test_cases_passed: 3,
        test_cases_total: 3,
      },
      {
        seedKey: 'interviewer-observer-active',
        problem_id: PROBLEM_IDS.dependencyResolver,
        status: 'active',
        createdDaysAgo: 0,
        duration_seconds: null,
        agent_deploy_count: 1,
        test_run_count: 1,
        compile_error_count: 1,
        total_llm_calls: 2,
        total_input_tokens: 8700,
        total_output_tokens: 2100,
        total_reasoning_tokens: 1500,
        cost_usd: 0.18,
      },
    ].map((session) => ({
      ...common,
      ...session,
      id: deterministicUuid(`${email}:${session.seedKey}:session`),
      session_token: deterministicUuid(`${email}:${session.seedKey}:token`),
      gce_instance_name: `anticode-seed-${metadata.username}-${session.seedKey}`,
      started_at: daysAgoTimestamp(session.createdDaysAgo, 14),
      ended_at: session.status === 'completed' ? daysAgoTimestamp(session.createdDaysAgo, 15) : null,
      created_at: daysAgoTimestamp(session.createdDaysAgo, 14),
      token_count: session.total_input_tokens + session.total_output_tokens + session.total_reasoning_tokens,
      metadata: { seed_key: session.seedKey, seed_user: email },
    }));
  }

  return [
    {
      seedKey: 'candidate-daily-completed',
      problem_id: PROBLEM_IDS.backendIoService,
      status: 'completed',
      createdDaysAgo: 0,
      duration_seconds: 2700,
      agent_deploy_count: 3,
      test_run_count: 6,
      compile_error_count: 1,
      total_llm_calls: 9,
      total_input_tokens: 54200,
      total_output_tokens: 12800,
      total_reasoning_tokens: 9400,
      cost_usd: 0.86,
      score: 88,
      test_cases_passed: 4,
      test_cases_total: 4,
    },
    {
      seedKey: 'candidate-agentic-completed',
      problem_id: PROBLEM_IDS.matrixOptimizer,
      status: 'completed',
      createdDaysAgo: 2,
      duration_seconds: 3600,
      agent_deploy_count: 5,
      test_run_count: 8,
      compile_error_count: 2,
      total_llm_calls: 13,
      total_input_tokens: 76100,
      total_output_tokens: 18400,
      total_reasoning_tokens: 14200,
      cost_usd: 1.24,
      score: 94,
      test_cases_passed: 3,
      test_cases_total: 3,
    },
    {
      seedKey: 'candidate-prompt-failed',
      problem_id: PROBLEM_IDS.promptDefense,
      status: 'completed',
      createdDaysAgo: 4,
      duration_seconds: 2100,
      agent_deploy_count: 2,
      test_run_count: 5,
      compile_error_count: 0,
      total_llm_calls: 6,
      total_input_tokens: 33800,
      total_output_tokens: 7200,
      total_reasoning_tokens: 5100,
      cost_usd: 0.49,
      score: 68,
      test_cases_passed: 2,
      test_cases_total: 3,
    },
    {
      seedKey: 'candidate-current-active',
      problem_id: PROBLEM_IDS.dependencyResolver,
      status: 'active',
      createdDaysAgo: 1,
      duration_seconds: null,
      agent_deploy_count: 1,
      test_run_count: 2,
      compile_error_count: 1,
      total_llm_calls: 3,
      total_input_tokens: 11900,
      total_output_tokens: 2800,
      total_reasoning_tokens: 1700,
      cost_usd: 0.22,
    },
  ].map((session) => ({
    ...common,
    ...session,
    id: deterministicUuid(`${email}:${session.seedKey}:session`),
    session_token: deterministicUuid(`${email}:${session.seedKey}:token`),
    gce_instance_name: `anticode-seed-${metadata.username}-${session.seedKey}`,
    started_at: daysAgoTimestamp(session.createdDaysAgo, 13),
    ended_at: session.status === 'completed' ? daysAgoTimestamp(session.createdDaysAgo, 14) : null,
    created_at: daysAgoTimestamp(session.createdDaysAgo, 13),
    token_count: session.total_input_tokens + session.total_output_tokens + session.total_reasoning_tokens,
    metadata: { seed_key: session.seedKey, seed_user: email },
  }));
}

async function seedUserDashboardData(supabase, authUser, metadata) {
  const email = authUser.email || metadata.username;
  const streakDays = metadata.role === 'interviewer' ? 3 : 6;
  const activityRows = Array.from({ length: streakDays }, (_, daysAgo) => ({
    user_id: authUser.id,
    activity_date: daysAgoDate(daysAgo),
    login_count: Math.max(1, streakDays - daysAgo),
    first_seen_at: daysAgoTimestamp(daysAgo, 9),
    last_seen_at: daysAgoTimestamp(daysAgo, 17),
    metadata: { seed_user: email },
  }));

  const { error: activityError } = await supabase
    .from('user_activity_days')
    .upsert(activityRows, { onConflict: 'user_id,activity_date' });

  if (activityError) {
    console.error(`${colors.red}❌ Error seeding activity days for ${email}: ${activityError.message}${colors.reset}`);
    return false;
  }

  const sessions = buildSeedSessions(authUser, metadata);
  const sessionRows = sessions.map((session) => ({
    id: session.id,
    candidate_id: session.candidate_id,
    problem_id: session.problem_id,
    session_token: session.session_token,
    session_type: session.session_type,
    status: session.status,
    gce_instance_name: session.gce_instance_name,
    gce_instance_zone: session.gce_instance_zone,
    started_at: session.started_at,
    ended_at: session.ended_at,
    duration_seconds: session.duration_seconds,
    agent_deploy_count: session.agent_deploy_count,
    test_run_count: session.test_run_count,
    compile_error_count: session.compile_error_count,
    total_llm_calls: session.total_llm_calls,
    total_input_tokens: session.total_input_tokens,
    total_output_tokens: session.total_output_tokens,
    total_reasoning_tokens: session.total_reasoning_tokens,
    token_count: session.token_count,
    cost_usd: session.cost_usd,
    metadata: session.metadata,
    created_at: session.created_at,
  }));
  const { error: sessionError } = await supabase
    .from('interview_sessions')
    .upsert(sessionRows, { onConflict: 'id' });

  if (sessionError) {
    console.error(`${colors.red}❌ Error seeding sessions for ${email}: ${sessionError.message}${colors.reset}`);
    return false;
  }

  const reportRows = sessions
    .filter((session) => session.status === 'completed')
    .map((session) => ({
      id: deterministicUuid(`${email}:${session.seedKey}:report`),
      session_id: session.id,
      submitted_code: `-- Seed dashboard snapshot for ${session.seedKey}`,
      score_agentic_flow: session.score,
      score_skill_verification: Math.max(0, session.score - 3),
      score_prompt_engineering: Math.min(100, session.score + 2),
      score_aggregate: session.score,
      summary_review: `Seeded dashboard scorecard for ${metadata.full_name}. This row exists only to exercise real Supabase dashboard statistics for test users.`,
      test_cases_passed: session.test_cases_passed,
      test_cases_total: session.test_cases_total,
      is_passing: session.score >= 70,
      detailed_results: {
        seed_key: session.seedKey,
        score_aggregate: session.score,
        source: 'scripts/create-test-users.mjs',
      },
      metadata: { seed_key: session.seedKey, seed_user: email },
      created_at: session.ended_at || session.created_at,
    }));

  const { error: reportError } = await supabase
    .from('evaluation_reports')
    .upsert(reportRows, { onConflict: 'id' });

  if (reportError) {
    console.error(`${colors.red}❌ Error seeding scorecards for ${email}: ${reportError.message}${colors.reset}`);
    return false;
  }

  console.log(`${colors.green}✅ Dashboard activity, sessions, and scorecards seeded for ${email}.${colors.reset}`);
  return true;
}

async function main() {
  console.log(`${colors.magenta}${colors.bright}======================================================`);
  console.log(`      🌌  A N T I C O D E   T E S T   U S E R S  🌌`);
  console.log(`======================================================${colors.reset}\n`);

  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}❌ Error: .env.local file not found at ${envPath}${colors.reset}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const supabaseUrl = getEnvVar(envContent, 'NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getEnvVar(envContent, 'SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(`${colors.red}❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}Initializing Supabase Admin Client...${colors.reset}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  await seedDailyChallenge(supabase);

  const testUsers = [
    {
      email: 'candidate@anticode.com',
      password: 'anticode123',
      user_metadata: {
        username: 'clara',
        full_name: 'Clara Candidate',
        role: 'candidate'
      }
    },
    {
      email: 'interviewer@anticode.com',
      password: 'anticode123',
      user_metadata: {
        username: 'ian',
        full_name: 'Ian Interviewer',
        role: 'interviewer'
      }
    }
  ];

  for (const user of testUsers) {
    console.log(`\n${colors.cyan}Creating/Syncing user: ${user.email} (${user.user_metadata.role})...${colors.reset}`);

    // Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`${colors.red}❌ Error listing users: ${listError.message}${colors.reset}`);
      continue;
    }

    const existingUser = users.find(u => u.email === user.email);
    let syncedAuthUser = null;

    if (existingUser) {
      console.log(`${colors.yellow}User ${user.email} already exists. ID: ${existingUser.id}. Updating password and metadata...${colors.reset}`);
      const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: user.password,
          user_metadata: user.user_metadata,
          email_confirm: true
        }
      );
      if (updateError) {
        console.error(`${colors.red}❌ Error updating user ${user.email}: ${updateError.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ User updated successfully!${colors.reset}`);
        syncedAuthUser = updated.user || existingUser;
      }
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true
      });

      if (createError) {
        console.error(`${colors.red}❌ Error creating user ${user.email}: ${createError.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ User created successfully! ID: ${newUser.user.id}${colors.reset}`);
        syncedAuthUser = newUser.user;
      }
    }

    if (syncedAuthUser) {
      const profileSynced = await syncProfile(supabase, syncedAuthUser, user.user_metadata);
      if (profileSynced) {
        await seedUserDashboardData(supabase, syncedAuthUser, user.user_metadata);
      }
    }
  }

  console.log(`\n${colors.magenta}${colors.bright}======================================================`);
  console.log(`                   🎉  D O N E  🎉`);
  console.log(`======================================================${colors.reset}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
