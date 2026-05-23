import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Running with offline demo fallbacks until NEXT_PUBLIC_SUPABASE_URL and a public anon/publishable key are configured."
  );
}

const offlineError = {
  message: "Supabase is not configured in this environment.",
  details: "NEXT_PUBLIC_SUPABASE_URL and a public anon/publishable key are required for database-backed flows.",
};

class OfflineQuery {
  select() { return this; }
  insert() { return this; }
  update() { return this; }
  delete() { return this; }
  upsert() { return this; }
  eq() { return this; }
  neq() { return this; }
  in() { return this; }
  order() { return this; }
  limit() { return this; }
  single() { return this; }
  maybeSingle() { return this; }

  then<TResult1 = { data: null; error: typeof offlineError }, TResult2 = never>(
    onfulfilled?: ((value: { data: null; error: typeof offlineError }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({ data: null, error: offlineError }).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null) {
    return Promise.resolve({ data: null, error: offlineError }).catch(onrejected);
  }

  finally(onfinally?: (() => void) | null) {
    return Promise.resolve({ data: null, error: offlineError }).finally(onfinally ?? undefined);
  }
}

function createOfflineSupabaseClient(): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: offlineError }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithOtp: async () => ({ data: { user: null, session: null }, error: offlineError }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: offlineError }),
      signUp: async () => ({ data: { user: null, session: null }, error: offlineError }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => undefined,
          },
        },
      }),
    },
    from: () => new OfflineQuery(),
    rpc: () => new OfflineQuery(),
    channel: () => ({
      on() { return this; },
      subscribe() { return this; },
    }),
    removeChannel: async () => ({ error: null }),
  } as unknown as SupabaseClient;
}

// Single-instance browser-compatible Supabase client.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createOfflineSupabaseClient();
