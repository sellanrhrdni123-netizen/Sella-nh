// ==============================================================================
// TATADANA SUPABASE CLIENT INFRASTRUCTURE MASTER RE-EXPORT
// ==============================================================================

export * from './config';
export { getBrowserClient, createClient as createBrowserClient } from './client';
export { createServerClientInstance, createClient as createServerClient } from './server';
export { getAdminClient, requireAdminClient } from './admin';
export { updateSession } from './middleware';
export * from './mappers';
export { DualStorageService, dualStorage } from './dual-storage';
export type { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database';
