-- Seeds the Supabase Vault secret that private.encrypt_service_key and
-- private.decrypt_service_key depend on (name: 'connection_encryption_key').
-- The vault secret is DATA, not schema — no earlier migration creates it, so
-- on a fresh project those functions would fail without this seed.
--
-- Idempotent by design: only creates the secret when it does not already
-- exist, so running this against the original live project will NOT overwrite
-- the real key already in use there.

select vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'hex'),
  'connection_encryption_key'
)
where not exists (
  select 1 from vault.decrypted_secrets where name = 'connection_encryption_key'
);
