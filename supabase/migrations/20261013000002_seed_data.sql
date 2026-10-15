-- ==============================================================================
-- TATADANA SEED DATA FOR SUPABASE
-- ==============================================================================

-- Demo User ID: 'a1111111-1111-1111-1111-111111111111'
-- Admin User ID: 'b2222222-2222-2222-2222-222222222222'

-- Note: In production Supabase, users are created in auth.users first.
-- This seed provides AI configs and default system setup.

insert into public.ai_provider_configs (provider, name, api_key_encrypted, model_name, is_active, priority, mode)
values
  ('gemini', 'Google Gemini 1.5 Flash', 'enc_gemini_demo_key_auto', 'gemini-1.5-flash', true, 1, 'parallel_failover'),
  ('openai', 'OpenAI GPT-4o Mini', 'enc_openai_demo_key_auto', 'gpt-4o-mini', true, 2, 'parallel_failover'),
  ('deepseek', 'DeepSeek Chat V3', 'enc_deepseek_demo_key_auto', 'deepseek-chat', true, 3, 'parallel_failover')
on conflict do nothing;
