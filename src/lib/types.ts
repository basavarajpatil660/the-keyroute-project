// TypeScript interfaces matching the existing Supabase schema (do not modify).
// RPC return types mirror the security-definer function signatures.

// ─── Table Types ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export interface SupabaseConnection {
  id: string
  user_id: string
  project_url: string
  is_active: boolean
  // service_key is encrypted via pgcrypto + Vault — never returned in plaintext
  created_at: string
  updated_at: string
}

export interface KeyLabel {
  id: string
  user_id: string
  provider: 'openai' | 'gemini' | 'groq' | 'anthropic' | 'custom'
  label: string           // e.g. "openai-work", "groq-fast"
  custom_base_url: string | null  // for provider: 'custom'
  is_active: boolean
  // vault_secret_id exists on the table but is never selected into the
  // frontend — omitted here on purpose, don't add it back without a reason
  created_at: string
}

export interface PlatformKey {
  id: string
  user_id: string
  key_hash: string        // hashed — raw key shown once on creation
  label: string | null
  created_at: string
  last_used_at: string | null
}

export interface UsageLog {
  id: string
  user_id: string
  platform_key_id: string
  label_used: string | null
  provider: string
  model: string
  status_code: number
  latency_ms: number | null
  prompt_tokens: number | null
  completion_tokens: number | null
  tokens_estimated: boolean
  error_message: string | null
  created_at: string
}

// ─── RPC Return Types ──────────────────────────────────────────────────────────

export interface UpsertConnectionResult {
  success: boolean
  connection_id: string
}

export interface CreatePlatformKeyResult {
  key_id: string
  raw_key: string   // shown once; not stored in plaintext
}

export interface ValidatePlatformKeyResult {
  valid: boolean
  user_id: string | null
}

export interface ResolveLabelResult {
  key_label_id: string
  provider: string
  decrypted_api_key: string
  endpoint_override: string | null
}

export interface AutoDetectResult {
  key_label_id: string
  label: string
  provider: string
  decrypted_api_key: string
  endpoint_override: string | null
}

// ─── UI State Types ────────────────────────────────────────────────────────────

export interface AuthState {
  session: import('@supabase/supabase-js').Session | null
  loading: boolean
}