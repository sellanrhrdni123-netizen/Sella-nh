// ==============================================================================
// TATADANA SUPABASE CLIENT ENTRYPOINT (BACKWARD-COMPATIBLE FORWARDER)
// ==============================================================================

import { getBrowserClient } from './supabase/client';
import { isSupabaseConfigured as checkConfigured } from './supabase/config';

export * from './supabase';

export const isSupabaseConfigured = checkConfigured;
export const supabase = getBrowserClient();
export default supabase;
