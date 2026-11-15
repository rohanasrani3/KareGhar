# KareGhar change log

This records the final approved behavior and wording. Product rules live in [AGENTS.md](AGENTS.md), interfaces in [docs/API.md](docs/API.md), and evidence from completed checks in [docs/EXPERIENCE-QA.md](docs/EXPERIENCE-QA.md).

## 2026-11-16

### Align workflow wording across the site

- README journeys explicitly follow In progress → Completed on proposal acceptance → finished-work upload, and describe the In progress default with an explicit All statuses option.
- Removed the lifecycle explanation from the Demand board in both languages. Aligned pending-selection labels in Impact/moderation, all-status discovery links, finished-work galleries, footer capitalization and account-deletion guidance.
- Corrected README upload guidance to the existing 4 MiB browser limit. No status logic, database schema or discovery defaults changed.

### Capitalize navigation labels

- English navbar labels are Find Artists, Find Demand and Our Impact. Find Demand defaults to In progress, with an explicit All statuses option.
- Clarified that migration 009 preserves the posted-demand total. No further PostgreSQL change is required for this copy update.

### Documentation and release handoff

- Replaced the technical README with concise artist/customer journeys, proposal rules and Work history guidance; contributor, setup and deployment instructions live in AGENTS.md. Clarified that open demands remain In progress even after proposals arrive, until one is accepted.
- Updated current contracts and rollout instructions through migration 009, distinguished historical browser checks from current behavior, and explained that connected hosting may deploy on push while PostgreSQL migrations remain manual.
- Corrected the bilingual Sample tooltip to match sample inclusion in Impact.

### Complete demands on proposal acceptance

- Accepting a proposal immediately sets the demand to Completed. In progress now describes the pre-selection proposal stage (`finding`). The selected artist can submit finished work afterward; ratings and submission-based rankings still require that file.
- Accepted demands stay on the public board and are available through the All statuses option. Work history defaults to All activity. Submission markers use the actual output rather than completion status, and acceptance copy explains later upload in English/Hindi.
- Customer cancellation remains available before upload. Account deletion remains blocked while a selected demand has no submission. Quotations, conversations and unpublished output remain private; reference images follow the now-public demand.
- Added repeatable migration 009 for legacy `progress` records without fabricating uploads or dates. Local SQLite applies it at startup. The existing local database was backed up and upgraded: 45 demands preserved, four legacy states converted, all other demand fields unchanged. PostgreSQL rollout is documented in [docs/DEPLOYMENT-009.md](docs/DEPLOYMENT-009.md); production has not been changed.
- Sample catalogue membership and its seed version stay unchanged; migration 009 upgrades existing selected samples, and new seeds create them as Completed without inventing submissions.
- Validation passed: experience/security suites, PostgreSQL migrations 001–009 and workflow rehearsal, server-rendered history assertions, lint, and the isolated local production build including TypeScript checks.

### Preserve and backfill fictional sample contacts

- Added a repeatable contact-only SQL repair for blank, non-deleted sample profiles, excluding admin grants. Fictional `username@example.invalid` contacts do not expose login email or change real accounts, existing contacts or demand records.
- Sample seeding preserves existing contacts and has a separate contact-upgrade marker, so an already recorded catalogue can receive the patch without inserting more demands.
- Documented why Impact and public discovery counts differ, along with read-only diagnostic SQL. No demand visibility or metric rules changed.
- Production public reads showed 17 Impact demands and 13 anonymous listings (6 open, 7 completed), plus missing contacts on two sample and two regular artists. No hosted database writes were performed.
- Validation passed: experience regressions, in-memory PostgreSQL rehearsal, lint and isolated local production build. Both database suites exercise repeated SQL repair, a previously seeded catalogue receiving the contact upgrade, and preservation of existing contacts, private emails, real/admin/deleted accounts and demand records.

### Admin compatibility with current accounts and demands

- Moderation account details now show public bio/contact with English/Hindi labels and a missing-contact fallback. Private login email and credentials remain excluded.
- Added legacy-admin regression coverage: create an admin using migrations 001/003, apply later migrations, preserve credentials/grants, log in, edit a profile with blank email/contact, change password and reject the old session while retaining moderation access after login.
- PostgreSQL rehearsal now preserves an admin from migration 003 through 008 and exercises its current profile/moderation queries. Admin privacy checks cover private proposals, messages, quotations, individual ratings, media and owner-only rating/sharing actions.
- The existing local `admin` account was inspected read-only and has the current account/demand schema, an active admin grant and a stored password. No existing passwords, account details or production records were changed. No new migration is required.
- Validation passed: experience/security regressions, in-memory PostgreSQL migration rehearsal, lint, TypeScript and the local production build. Hosted admin login and browser layout were not verified.

### Require public contact at signup

- Customer and artist signup requires public contact of 1–240 characters after trimming. English/Hindi help explains public visibility and keeps the login email private. The server validates and stores contact during account creation; existing accounts are not backfilled and need no schema migration.
- Documented Vercel production admin provisioning through the existing script: reuse an admin already in the same PostgreSQL database, or create a fresh production admin when the original exists only in local SQLite.
- Validation: customer/artist signup regressions cover missing, blank and oversized contact, trimmed persistence, public contact visibility and private login email. Experience/security suites, lint, TypeScript and the local production build passed. No production accounts were changed.

### Restore sample data impact

- Impact includes sample demands alongside real activity in all totals, connection counts and average agreed fee, superseding the real-only Impact entry below.
- English notice: “Includes real activity and sample data impact. Sample demands, artist connections and fees are included to show how the marketplace works. Sample fees are fictional.” Matching Hindi copy is included.
- Demand connections distributes its four rows through the panel height, with larger values and thin dividers; narrow screens retain a single-column layout.
- Validation: experience regressions, lint, TypeScript and the local production build passed. English/Hindi production HTTP checks passed against isolated sample data (44 demands, 17 connected artists). Browser layout verification could not be completed in this session.

## 2026-11-15

### Live-looking sample catalogue (supersedes earlier sample, Impact and footer entries below)

- Samples now look like ordinary listings: readable usernames (for example `meera_patil`), realistic bios, deadlines and 2026 dates. No public contact, placeholder titles, `@example.invalid` contacts or “fictional” notices are shown. Each sample keeps one small **Sample** tag (Hindi: नमूना); sample demand pages show a disabled proposal preview instead of the old notice.
- Sample customers rate sample completions: every sample artist has 1–4 ratings (mostly 4–5 stars, a few 3s). Later completions per artist stay private but still count and are rated. This replaces the earlier rule that samples get no invented ratings.
- Portfolio media are real Wikimedia Commons photos and recordings. Every gallery caption credits the photographer or performer; `/credits` (footer link **Credits**) lists photos and recordings. Generated placeholder tunes and SVGs (`public/seed`, `scripts/generate-sample-media.mjs`) were removed. No suitable Baul recording was found, so the Baul artist shows a photo only.
- **Impact counts real activity only** (`sample=0`), with the line “Counts real activity only. Sample listings on the site are not included.”
- Approved footer sentence replacing the Sample data sentence: “Listings tagged “Sample” show how the marketplace works.” Credits line: “Photographs and recordings from Wikimedia Commons. View their authors, sources and licences.”
- Seeding records `samples:<version>` in `schema_migrations` and skips on later cold starts; bump `SEED_VERSION` in `src/server/samples.ts` when sample data changes.

### Demand workflow and customer ratings

- Customers accept an artist's proposal to select that artist and lock the agreed fee. The demand moves from Finding to In progress.
- The assigned artist uploads the finished work. Submission automatically marks the demand Done/Completed, records the submission time, makes it count toward rankings and enables **Rate artist** for the owning customer.
- Removed customer acceptance of finished work, the associated action/button, confirmation checkbox and fourth timeline step. The timeline now ends at **Work submitted**. Proposal acceptance remains available.
- Ratings require a finished submission. Selecting a proposal alone does not enable rating, and uploading ordinary portfolio work does not enable a demand rating.
- Customers can create or update one integer rating from 1–5 stars per demand in Work history. Artists, unrelated customers, anonymous visitors and sample records cannot rate it. Session and participant-pause checks apply on the server.
- Public and own artist profiles and artist-directory cards show the average score and rating count. Each rated demand contributes once, including private finished work. Editing a score updates that rating rather than adding another one.
- Finished pieces show their own score in the submission gallery and, when shared, on demand pages and public artist galleries. Unrated work says **Not rated yet**. Private individual scores are limited to the customer and assigned artist; the public aggregate does not reveal private files or individual scores.
- Ratings and public sharing remain independent of each other and of ranking. The customer chooses whether to publish the submitted work and may change that choice later.
- Artist rankings count Done demands with a nonempty finished submission, including private work and clearly tagged pilot samples. Shared ranks and no-rank-for-zero behavior remain. Ordinary portfolio uploads and rating values do not increase the completion count.
- Customers may cancel a selection before finished submission, reopening the demand at its original budget. Historical conversations, quotations and archived outputs remain scoped to their original participants.
- Legacy finished-work approval events and timestamps remain stored for compatibility. They no longer appear as workflow steps, read-contract fields or unread notifications. Unsupported calls to the removed action are rejected.

Implementation: `src/server/actions.ts`, `src/server/market.ts`, `src/server/history.ts`, `src/contract/schemas.ts`, `src/components/rating.tsx`, `src/components/rating-form.tsx`, shared galleries, profile/directory/demand pages and private Work history.

### Impact

The page measures marketplace connections and agreed value. Work and payment take place directly between the customer and artist; the website does not verify delivery or payment.

| Metric | Definition |
| --- | --- |
| Agreed demand value | Sum of agreed fees on demands with a selected artist in In progress or Done. |
| Demands with an artist selected | Number of those selected demands, regardless of submission or rating. |
| Artists connected | Distinct artists selected for at least one demand in In progress or Done. |
| Customers posting demands | Distinct customers who have posted a demand. |
| Demands posted / Finding an artist / Artist selected | Supporting counts for posted demands, Finding demands and selected demands. |
| Average agreed fee | Agreed demand value divided by the selected-demand count; an em dash when none exist. |

Removed the completed-demand total, completion rate, average fee per completed demand and wording about customers accepting finished work. Pilot samples remain included and explicitly labelled; their fees are fictional, not verified earnings. Selecting a proposal changes connection/value totals, cancellation reverses that selection, and submission alone does not change those totals.

Implementation: `src/app/impact/page.tsx` and the impact checks in `scripts/test-experience.mjs`.

### Naming and navigation

| Meaning | Approved interface name |
| --- | --- |
| Customer request | demand; Hindi: माँग |
| Public request discovery page and footer link | Demand board; Hindi: माँग बोर्ड |
| Main navigation link to that page | Find Demand; Hindi: माँग खोजें |
| Artist response | proposal |
| Private workspace | Work history |
| Artist portfolio entry or finished artwork | work / finished work, where it describes the artwork rather than the customer request |

Applied the demand/proposal terminology across discovery, posting, profiles, Work history, admin screens, forms, help text and sample descriptions. Existing `/commissions` URLs, TypeScript names, action identifiers and the `completed` ranking field remain compatible. Migration 008 subsequently aligns physical storage with demand terminology. The Impact page no longer exposes a completed-demand metric. Authored customer/artist content is preserved. Interface changes have matching Hindi copy.

### Homepage and footer copy

The homepage process now reads:

1. **Find the right fit:** “Explore portfolios or post a demand with your budget, references, and the kind of work you need.”
2. **Talk before you start:** “Exchange a private proposal. Contact the artist to agree on the scope, price, timing, and payment before choosing an artist.”
3. **Make it, then share it:** “Artists submit their finished piece, and customers can then rate the artist. Artists rank based on the number of finished submissions.”

The shared footer places the linked KareGhar name before this approved paragraph:

> connects India’s folk artists with customers who have personalized demands. We aim at rejuvenating the rich Indian folk artistry by providing this marketplace. The examples marked “Sample data” help you explore the pilot, including its rankings and impact.

Photo credits have moved off homepage photos and craft tiles to a separate line at the absolute bottom of the shared footer. **Photo credits** links to `/credits`, which retains the photographers, original sources and licence details. The accompanying line reads: “Photographs from Wikimedia Commons. View photographers, sources and licences.”

Implementation: `src/app/page.tsx`, `src/components/site-footer.tsx`, `src/app/credits/page.tsx` and footer styles in `src/app/globals.css`.

### Portfolio controls

- Removed the bottom **Add more work** tile and its unused CSS.
- Populated portfolios keep the blue top-right **Add work** button.
- Empty portfolios retain **Add your first work** so onboarding remains usable.
- Existing add/edit/remove dialogs remain available.

Implementation: `src/components/portfolio-manager.tsx` and `src/components/profile.css`.

### Logo and browser tab icon

- The header uses the full original transparent `public/kareghar-logo.png`, including its wordmark and tagline. Its home link has a localized accessible label; responsive sizing preserves the image proportions. The previous SVG logo component was removed.
- The tab icon uses only the original house illustration, excluding the wordmark and tagline. The final asset is an exact crop of the original artwork, with transparency and proportions preserved.
- `public/kareghar-icon.png` is 256×256. It was made from the left 700×754 region of the original image, trimming transparent edges, fitting the house inside 240×240 and adding 8px of transparent padding on each side.
- `src/app/favicon.ico` contains transparent PNG frames at 16, 32, 48, 64, 128 and 256px.
- `src/app/layout.tsx` declares `/kareghar-icon.png` as the PNG icon and `/favicon.ico` as the shortcut icon. Next.js also serves the app favicon conventionally.
- `design/logo-options/` remains an archive of earlier concepts; those designs are not the active assets. Chrome may keep a cached old icon until the tab is reopened.

### Database upgrade and release boundary

- Apply PostgreSQL migrations 001–008 in order, only applying migrations that have not already run.
- `006_ratings.sql` creates one protected customer rating per demand, its artist index and integer score bounds. Row-level security is enabled and public/browser privileges are revoked.
- `007_submission_workflow.sql` marks existing In-progress demands with a nonempty output and assigned artist as Done. It retains existing submission timestamps or falls back to the update/creation time, preserving files and publication choices. The `schema_migrations` marker makes local initialization idempotent; this table is also protected in PostgreSQL.
- `scripts/init-local-db.mjs` applies the upgrades automatically inside the local initialization transaction. The existing default local database was upgraded; isolated QA data stays in ignored directories.
- Samples retain their tags and are not assigned invented customer ratings. Seed timestamps now describe submission rather than a new approval event.
- `008_demand_naming.sql` renames demand tables, dependent columns, indexes and PostgreSQL constraints while retaining history, access controls and the legacy approval timestamp. Apply it before running this application version against existing PostgreSQL.
- Source publication does not mutate or deploy the hosted database. In-memory PostgreSQL migration/RLS checks pass; actual hosted permissions, storage and simultaneous transactions remain release checks.

### Verification recorded

- `npm run lint`, `npm run build`, the expanded `npm run test:experience` suite and whitespace checks passed after the relevant code changes.
- Integration checks cover upgrades/repeated initialization, proposal/selection ownership, cancellation and private history/media, automatic completion at submission, rejection of premature/unauthorized ratings, integer bounds, edits, averages, publication privacy, unchanged rank counts and connection-based impact totals.
- Browser checks with isolated local QA accounts confirmed no rating form before submission, the three-step timeline, saving a 5-star rating after submission, profile/per-work rating presentation, footer/photo-credit placement and revised Impact copy in English and Hindi. English was restored after the checks.
- The portfolio/nav follow-up passed lint and build; no separate new browser walkthrough was recorded for that small follow-up.
- The favicon follow-up passed lint and build. An isolated production preview returned HTTP 200 with the correct content types and exact files for both icon URLs. Rendered page metadata included both links, and all six ICO frames decoded at the expected sizes with alpha transparency. This verifies serving and metadata, not a refresh of a specific Chrome tab's cache.
- A dependency reinstall encountered a Windows lock on loaded native modules; `npm install` restored dependencies. Production builds required permission to write generated route files outside the filesystem sandbox.

See [AGENTS.md](AGENTS.md) for setup and deployment, and [docs/EXPERIENCE-QA.md](docs/EXPERIENCE-QA.md) for the detailed validation record.
