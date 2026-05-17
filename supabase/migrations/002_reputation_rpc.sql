-- RPC function to atomically increment a user's reputation
-- Used by the governance engine when proposals are canonized

CREATE OR REPLACE FUNCTION increment_reputation(target_user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET reputation = COALESCE(reputation, 0) + amount
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: pg_cron setup for auto-tallying expired proposals
-- Uncomment if your Supabase plan supports pg_cron (Pro+)
--
-- SELECT cron.schedule(
--   'tally-expired-proposals',
--   '0 * * * *',  -- every hour
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/tally-proposals',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     )
--   );
--   $$
-- );
