BEGIN;
CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY);
-- Existing finished submissions no longer wait for a customer approval step.
UPDATE commissions SET status='done',
 submitted_at=CASE WHEN submitted_at>0 THEN submitted_at WHEN updated>0 THEN updated ELSE created END
 WHERE status='progress' AND output<>'' AND artist IS NOT NULL;
INSERT INTO schema_migrations(version) VALUES('007_submission_workflow') ON CONFLICT DO NOTHING;
-- PostgreSQL privileges
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON schema_migrations FROM PUBLIC,anon,authenticated;
COMMIT;
