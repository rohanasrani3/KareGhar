BEGIN;
-- Proposal acceptance completes the demand. Uploading finished work is a
-- separate later action; do not invent output or submission timestamps.
-- Retain historical events, quotations, files, ratings and sharing preferences.
UPDATE demands
SET status=CASE WHEN artist IS NOT NULL THEN 'done' ELSE 'finding' END
WHERE status='progress';
INSERT INTO schema_migrations(version) VALUES('009_selection_completion') ON CONFLICT DO NOTHING;
COMMIT;
