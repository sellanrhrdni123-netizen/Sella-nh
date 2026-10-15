// ==============================================================================
// TATADANA SUPABASE CONFIGURATION & ENVIRONMENT DETECTOR
// ==============================================================================

export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  storageBucket: string;
  isConfigured: boolean;
  isAdminConfigured: boolean;
}

export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'tatadana-exports';

  const isConfigured =
    url.trim().length > 0 &&
    !url.includes('demo') &&
    !url.includes('your-project') &&
    anonKey.trim().length > 0 &&
    !anonKey.includes('demo-anon') &&
    !anonKey.includes('your-anon-key');

  const isAdminConfigured =
    isConfigured &&
    serviceRoleKey.trim().length > 0 &&
    !serviceRoleKey.includes('demo-service-role') &&
    !serviceRoleKey.includes('your-service-role-key');

  return {
    url,
    anonKey,
    serviceRoleKey,
    storageBucket,
    isConfigured,
    isAdminConfigured,
  };
}

export const isSupabaseConfigured = (): boolean => getSupabaseEnvConfig().isConfigured;
export const isSupabaseAdminConfigured = (): boolean => getSupabaseEnvConfig().isAdminConfigured;
