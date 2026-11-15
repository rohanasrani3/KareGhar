# KareGhar change log

This records the final approved behavior and wording. Product rules live in [AGENTS.md](AGENTS.md), interfaces in [docs/API.md](docs/API.md), and evidence from completed checks in [docs/EXPERIENCE-QA.md](docs/EXPERIENCE-QA.md).

## 2026-11-15

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

See [README.md](README.md) for setup and deployment, and [docs/EXPERIENCE-QA.md](docs/EXPERIENCE-QA.md) for the detailed validation record.
