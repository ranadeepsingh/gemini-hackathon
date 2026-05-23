import { createClient } from '@supabase/supabase-js';
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

async function main() {
  console.log(`${colors.magenta}${colors.bright}======================================================`);
  console.log(`      🌌  Y E E T C O D E   T E S T   U S E R S  🌌`);
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

  const testUsers = [
    {
      email: 'candidate@yeetcode.com',
      password: 'yeetcode123',
      user_metadata: {
        username: 'clara',
        full_name: 'Clara Candidate',
        role: 'candidate'
      }
    },
    {
      email: 'interviewer@yeetcode.com',
      password: 'yeetcode123',
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
      await syncProfile(supabase, syncedAuthUser, user.user_metadata);
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
