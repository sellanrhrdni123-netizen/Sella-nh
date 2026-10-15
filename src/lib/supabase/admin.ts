// ==============================================================================
// TATADANA ADMIN SUPABASE CLIENT (Service Role Key / Elevated Privileges)
// ==============================================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { getSupabaseEnvConfig } from './config';

let adminClientInstance: SupabaseClient<Database> | null = null;

/**
 * Creates or retrieves the Supabase Admin Client using the service role key.
 * Bypasses Row Level Security for webhooks, background cron tasks, and admin routes.
 */
export function getAdminClient(): SupabaseClient<Database> | null {
  const config = getSupabaseEnvConfig();
  if (!config.isAdminConfigured) {
    return null;
  }

  if (!adminClientInstance) {
    adminClientInstance = createSupabaseClient<Database>(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClientInstance;
}

/**
 * Asserts that the Admin Client is configured, throwing an actionable error if not.
 */
export function requireAdminClient(): SupabaseClient<Database> {
  const client = getAdminClient();
  if (!client) {
    throw new Error('Supabase Admin Client cannot be initialized: SUPABASE_SERVICE_ROLE_KEY is not configured or in demo mode.');
  }
  return client;
}
