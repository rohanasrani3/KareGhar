-- Run in the production Supabase SQL editor after migrations 001–008.
-- Repeatable: fills only blank public contacts on non-deleted sample accounts.
-- Does not copy private email, change real accounts, or insert/delete demands.
BEGIN;
UPDATE accounts
SET contact = username || '@example.invalid'
WHERE sample = 1 AND deleted = 0 AND TRIM(contact) = ''
  AND NOT EXISTS (SELECT 1 FROM admin_grants g WHERE g.account = accounts.id);
COMMIT;

-- Expected after the update: 0. These are fictional, non-deliverable addresses.
SELECT COUNT(*) AS sample_accounts_still_missing_contact
FROM accounts
WHERE sample = 1 AND deleted = 0 AND TRIM(contact) = ''
  AND NOT EXISTS (SELECT 1 FROM admin_grants g WHERE g.account = accounts.id);
