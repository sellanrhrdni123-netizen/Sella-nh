// ==============================================================================
// TATADANA BROWSER SUPABASE CLIENT (@supabase/ssr)
// ==============================================================================

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { getSupabaseEnvConfig, isSupabaseConfigured } from './config';

let clientInstance: SupabaseClient<Database> | null = null;

/**
 * Returns the Supabase Browser Client instance.
 * Returns null if running in mock / offline environment.
 */
export function getBrowserClient(): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') return null;

  const config = getSupabaseEnvConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(config.url, config.anonKey);
  }

  return clientInstance;
}

/**
 * Standard factory pattern per @supabase/ssr conventions.
 */
export function createClient(): SupabaseClient<Database> | null {
  return getBrowserClient();
}

export { isSupabaseConfigured };
