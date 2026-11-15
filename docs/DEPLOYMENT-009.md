# Complete demands when a proposal is accepted

The app now has two demand states: **In progress** (`finding`, before the customer accepts a proposal) and **Completed** (`done`, immediately on acceptance). The selected artist uploads finished work afterward. Ratings and artist rankings still require that upload; uploaded work stays private until the customer publishes it.

## Local development

Startup automatically applies migration 009 to SQLite. Restart an already running development server so its cached database connection runs initialization again. Existing selected demands become Completed; files, messages, quotations, ratings and sharing preferences are preserved.

## Production PostgreSQL / Supabase

1. In the production project's SQL Editor, confirm migration 008 is already applied:

   ```sql
   SELECT version FROM schema_migrations
   WHERE version IN ('008_demand_naming', '009_selection_completion');
   ```

   If 008 is missing, apply the outstanding numbered migrations through 008 in order, once each. Do not rerun historical migrations on an already upgraded database.
2. Run the complete contents of [009_selection_completion.sql](../migrations/009_selection_completion.sql). This converts old `progress` rows to `done` when an artist is assigned, or `finding` otherwise. It does not add/delete demands or invent finished files or submission timestamps.
3. Deploy this version immediately afterward. A push to a Vercel-connected production branch may start deployment automatically; pushing does not run the SQL migration. If this code is already deployed, run migration 009 now. If the previous build accepted proposals between migration and deployment, rerun migration 009 after deployment; it is repeatable. Avoid processing work in the short interval because the old build expects the old state.
4. Verify:

   ```sql
   SELECT status, COUNT(*) AS demands
   FROM demands GROUP BY status ORDER BY status;

   SELECT COUNT(*) AS legacy_progress_rows
   FROM demands WHERE status='progress';
   ```

   `legacy_progress_rows` must be **0**. In Work history, verify that an accepted proposal shows Completed, its selected artist can submit a file, and rating becomes available only after submission.

The Demand board defaults to All statuses and includes accepted demands even before upload. Migration 009 preserves the total number of demands, so an Impact total of 17 stays 17; it changes statuses, not catalogue membership. Its count can still differ from Impact when search filters, paused accounts or the signed-in user's own listings are excluded.

No database reset or full sample reseed is needed. Leave `KAREGHAR_SEED_SAMPLES` unset or set to `0` if you want to preserve the hosted sample catalogue exactly; enabling a full seed on an incomplete catalogue may add missing fixtures. This workflow update retains the existing catalogue seed version. The separate [sample-contact repair](../scripts/backfill-sample-contacts.sql) remains available for blank fictional contacts.
