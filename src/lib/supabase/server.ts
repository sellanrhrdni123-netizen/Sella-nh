// ==============================================================================
// TATADANA SERVER SUPABASE CLIENT (@supabase/ssr)
// ==============================================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { getSupabaseEnvConfig } from './config';

/**
 * Creates a Supabase Server Client for Next.js App Router (Server Components / Actions / Route Handlers).
 * Handles cookie read/write safely with try/catch to prevent read-only errors in Server Components.
 */
export function createServerClientInstance(): SupabaseClient<Database> | null {
  const config = getSupabaseEnvConfig();
  if (!config.isConfigured) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component (read-only cookie store).
          // Safely ignored as session refresh is handled by Next.js middleware.
        }
      },
    },
  });
}

export const createClient = createServerClientInstance;
