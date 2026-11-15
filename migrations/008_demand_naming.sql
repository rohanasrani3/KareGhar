BEGIN;
-- Preserve existing records while aligning storage with the product vocabulary.
DROP VIEW commission_state;
ALTER TABLE commissions RENAME TO demands;
ALTER TABLE commission_events RENAME TO demand_events;
ALTER TABLE commission_ratings RENAME TO demand_ratings;
ALTER TABLE proposals RENAME COLUMN commission TO demand;
ALTER TABLE demand_events RENAME COLUMN commission TO demand;
ALTER TABLE demand_ratings RENAME COLUMN commission TO demand;
ALTER TABLE messages RENAME COLUMN commission TO demand;
ALTER TABLE history_reads RENAME COLUMN commission TO demand;
ALTER TABLE demands RENAME COLUMN accepted_at TO legacy_accepted_at;
DROP INDEX commission_artist_status;
DROP INDEX commission_event_time;
DROP INDEX commission_ratings_artist;
CREATE INDEX demand_artist_status ON demands(artist,status,form);
CREATE INDEX demand_event_time ON demand_events(demand,created);
CREATE INDEX demand_ratings_artist ON demand_ratings(artist);
CREATE INDEX demand_customer_created ON demands(customer,created);
CREATE INDEX demand_discovery ON demands(status,created);
CREATE INDEX proposal_artist_demand ON proposals(artist,demand);
CREATE VIEW demand_state AS
 SELECT d.*, CASE WHEN owner.suspended=1 OR artist.suspended=1 THEN 1 ELSE 0 END AS paused
 FROM demands d JOIN account_state owner ON owner.id=d.customer LEFT JOIN account_state artist ON artist.id=d.artist;
INSERT INTO schema_migrations(version) VALUES('008_demand_naming') ON CONFLICT DO NOTHING;
-- PostgreSQL privileges
-- Renames retain row-level security and table grants; recreated views need grants revoked.
REVOKE ALL ON demand_state FROM PUBLIC,anon,authenticated;
-- Rename automatically generated PostgreSQL constraint names as well.
ALTER TABLE demands RENAME CONSTRAINT commissions_pkey TO demands_pkey;
ALTER TABLE demands RENAME CONSTRAINT commissions_customer_fkey TO demands_customer_fkey;
ALTER TABLE demands RENAME CONSTRAINT commissions_form_fkey TO demands_form_fkey;
ALTER TABLE demands RENAME CONSTRAINT commissions_artist_fkey TO demands_artist_fkey;
ALTER TABLE demands RENAME CONSTRAINT commissions_fee_check TO demands_fee_check;
ALTER TABLE demands RENAME CONSTRAINT commissions_status_check TO demands_status_check;
ALTER TABLE demands RENAME CONSTRAINT commissions_output_type_check TO demands_output_type_check;
ALTER TABLE proposals RENAME CONSTRAINT proposals_commission_fkey TO proposals_demand_fkey;
ALTER TABLE proposals RENAME CONSTRAINT proposals_commission_artist_key TO proposals_demand_artist_key;
ALTER TABLE demand_events RENAME CONSTRAINT commission_events_pkey TO demand_events_pkey;
ALTER TABLE demand_events RENAME CONSTRAINT commission_events_commission_fkey TO demand_events_demand_fkey;
ALTER TABLE demand_events RENAME CONSTRAINT commission_events_actor_fkey TO demand_events_actor_fkey;
ALTER TABLE demand_ratings RENAME CONSTRAINT commission_ratings_pkey TO demand_ratings_pkey;
ALTER TABLE demand_ratings RENAME CONSTRAINT commission_ratings_commission_fkey TO demand_ratings_demand_fkey;
ALTER TABLE demand_ratings RENAME CONSTRAINT commission_ratings_customer_fkey TO demand_ratings_customer_fkey;
ALTER TABLE demand_ratings RENAME CONSTRAINT commission_ratings_artist_fkey TO demand_ratings_artist_fkey;
ALTER TABLE demand_ratings RENAME CONSTRAINT commission_ratings_score_check TO demand_ratings_score_check;
ALTER TABLE messages RENAME CONSTRAINT messages_commission_fkey TO messages_demand_fkey;
ALTER TABLE history_reads RENAME CONSTRAINT history_reads_commission_fkey TO history_reads_demand_fkey;
-- PostgreSQL 18 also names NOT NULL constraints. Older releases have no rows
-- of this type, so the same migration remains compatible with their catalogues.
DO $$
DECLARE legacy_constraint record;
DECLARE current_name text;
BEGIN
 FOR legacy_constraint IN
  SELECT n.nspname,t.relname,c.conname FROM pg_constraint c
  JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
  WHERE n.nspname='public' AND c.contype='n'
   AND (c.conname LIKE '%commission%' OR c.conname='demands_accepted_at_not_null')
 LOOP
  current_name := replace(replace(replace(replace(replace(legacy_constraint.conname,
   'commission_events','demand_events'),'commission_ratings','demand_ratings'),
   'commissions','demands'),'_commission_','_demand_'),'_accepted_at_','_legacy_accepted_at_');
  EXECUTE format('ALTER TABLE %I.%I RENAME CONSTRAINT %I TO %I',
   legacy_constraint.nspname,legacy_constraint.relname,legacy_constraint.conname,current_name);
 END LOOP;
END $$;
COMMIT;
