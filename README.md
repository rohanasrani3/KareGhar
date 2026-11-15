# KareGhar

Empowering artisans. Enabling businesses

Customers post demands. Artists send private proposals, the customer selects an artist, and the artist submits a finished file. Submission automatically marks the demand completed, enables the customer’s rating, and leaves public sharing to the customer. Find artists by art category, form and completed demands. Switch between English and Hindi in the header.

There is no customer acceptance step for finished work. Work and payment take place directly between the participants. A proposal selection alone does not enable rating; the artist must submit the finished work first. See [the change log](CHANGELOG.md) for the approved changes and wording recorded on 15 November 2026.

## Run locally

Use Node.js 24. Run `npm ci` then `npm run dev`. Open http://localhost:3000. Local development automatically creates a persistent SQLite database and media directory under the ignored `.kareghar/` folder. Generated examples are labeled Sample data. Sign up separately as a customer and an artist to try the full workflow.

- `/commissions` — Demand board for browsing customer demands; the main navigation calls it Find Demand
- `/talent` — filter and rank artists
- `/profile` — view and edit personal details, bio, public contact and photo
- `/profile?tab=portfolio` — add, edit and remove portfolio work
- `/profile/history` — Work history: private proposals, quotations, messages, progress, submissions and customer ratings
- `/profile?tab=security` — password and account deletion
- `/impact` — demand connections and agreed fees

## Supabase and hosting

1. Apply migrations/001_marketplace.sql followed by migrations/002_supabase.sql, migrations/003_moderation.sql, migrations/004_experience.sql, migrations/005_deadline.sql, migrations/006_ratings.sql, migrations/007_submission_workflow.sql and migrations/008_demand_naming.sql in the Supabase SQL editor. Apply each migration once, in order. Historical migrations 001–007 remain unchanged. Migration 004 adds profile fields, quotations, reference media, private messages, notifications and event history while preserving existing records. Migration 005 adds deadlines; migration 006 adds one customer rating per completed demand; migration 007 upgrades existing finished submissions to Done without a separate customer approval step. Migration 008 aligns physical storage with demand terminology while retaining records, constraints and access controls. Apply 008 before running this code against an existing PostgreSQL database. The second migration enables row-level security, revokes public API access and creates the private kareghar bucket; later migrations protect their new tables too.
2. Set server-only DATABASE_URL (Supabase PostgreSQL connection string with TLS), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXTAUTH_SECRET (random secret), and NEXTAUTH_URL (canonical HTTPS origin). Auth.js manages sessions. Keep privileged credentials off the client.
3. Build with `npm run build` and serve with `npm start` on a Node host such as Render. Set the host runtime to Node 24. For an explicitly local production-build smoke test, use KAREGHAR_LOCAL=1, a local NEXTAUTH_URL and a temporary NEXTAUTH_SECRET.
4. Set KAREGHAR_SEED_SAMPLES=1 only if sample records should be inserted into a connected database. Accounts created by signup are always real, single-role accounts.

Sample data (src/server/samples.ts) has five fictional customers, one fictional artist for each of the 17 seed art forms, portfolio work, and 17 commissions across Finding, In-progress and Done. Its artwork and tunes in public/seed are generated placeholders, not real artists' work. Run `node scripts/generate-sample-media.mjs` to regenerate them. Sample records cannot sign in or accept proposals. They do count toward pilot rankings and impact, with visible sample labels and a notice that their fees are fictional. Rankings count only demands with an artist’s finished submission, not ordinary portfolio uploads.

Local SQLite applies migrations automatically. Set KAREGHAR_DATA_DIR to a separate directory (for example `.kareghar/qa-experience`) for isolated local tests; the default is `.kareghar`. Work in progress and private conversations are available through Work history rather than public discovery. Login email stays private; the optional public contact field is explicitly opt-in.

Run `npm run test:experience` for the isolated workflow regression checks and `npm run test:security` for persistent attempt limits, session invalidation, upload signatures/formats, private media access, byte ranges and deleted-account moderation. See [experience validation](docs/EXPERIENCE-QA.md) for the browser scenarios and deployment limitations.

Customers can rate the artist from 1–5 stars in Work history only after finished work is submitted, and update their rating later. Artist profiles and directory tiles show the average and number of ratings; published finished work shows its individual rating. Private completions contribute to the average while their individual ratings remain participant-only. Ratings do not change completion-based ranks. User-facing terminology is demand, proposal and Work history; existing `/commissions` URLs remain compatible.

Uploads are limited to 5 MiB and pass through the authenticated server before storage. File signatures determine the stored format; image/audio/video demands require the corresponding submission type. Physical/live/other demands accept any supported proof file. Profile photos are public. Finished files are private to participants until the customer publishes them. The media route checks access on every read, including byte-range requests and reads after a customer hides an output. Missing files return 404; unavailable storage returns 503.

The selected artist's agreed quotation is private to the customer and that artist. Public discovery and other proposers see the original budget. Login attempts use a persistent per-username limit; password changes and account deletion share a per-account limit of 12 attempts per 15 minutes. Successful verification resets the relevant budget.

The current database uses `demands`, `demand_state`, `demand_events` and `demand_ratings`, with `demand` foreign-key columns. The old finished-work approval timestamp is retained as `legacy_accepted_at`. Existing `/commissions` URLs, Server Action names and TypeScript names remain compatible; see [the API contract](docs/API.md) for the migration mapping.

Run `npm run lint` and `npm run build` before submitting.

For an isolated PostgreSQL migration and workflow rehearsal, install the optional runtime with `npm install --prefix .kareghar/pg-audit --no-audit --no-fund @electric-sql/pglite`, then run `node scripts/test-migrations.mjs`. It uses in-memory PostgreSQL and does not connect to the deployment database.

## Interface and branding

The discovery heading and footer use **Demand board**; only the main navigation uses **Find Demand**. Artist responses are **proposals**, and the private workspace is **Work history**. The homepage explains contacting the artist to agree on scope, price, timing and payment, then rating after finished submission. English/Hindi labels and help are kept together.

Populated portfolios have one blue **Add work** button at the top right. The bottom add-more tile is removed; an empty portfolio still offers **Add your first work**. Editing/removing a work continues through its dialog.

The full header logo is `public/kareghar-logo.png`. The tab uses a transparent house-only crop at `public/kareghar-icon.png` (256×256) and `src/app/favicon.ico` (16, 32, 48, 64, 128 and 256px frames), declared in `src/app/layout.tsx`. The artwork comes from the original logo, with the wordmark and tagline excluded from the icon. Reopen a Chrome tab if its cached icon has not refreshed. Earlier designs under `design/logo-options` are archived concepts.

The shared footer uses the approved folk-art marketplace paragraph and explains Sample data. Photo attribution appears in a separate **Photo credits** line at its bottom, linking to `/credits` for photographers, sources and licences. Homepage photographs and craft tiles have no overlaid credits. Exact English process/footer copy is recorded in [CHANGELOG.md](CHANGELOG.md).

Impact reports agreed demand value, selected demands, unique selected artists, posting customers and average agreed fee. It includes tagged pilot samples, removes completion totals/rates and does not claim verified payments or earnings.

## Project documentation

| File | Maintains |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Product rules, asset decisions, runtime guidance and function index. |
| [CHANGELOG.md](CHANGELOG.md) | Dated changes, approved wording and release notes. |
| [docs/API.md](docs/API.md) | HTTP/read/Server Action contracts, authorization and metric definitions. |
| [docs/EXPERIENCE-QA.md](docs/EXPERIENCE-QA.md) | Checks performed, results and verification limits. |
| [docs/TEAM.md](docs/TEAM.md) | Team responsibilities and pilot handoff. |

The changes recorded here are local. Before a hosted release, apply any outstanding migrations through 008 and verify PostgreSQL permissions and hosted media; see the Supabase instructions above.

## Admin provisioning

Run npm run admin:create -- Admin from the project directory to create a fresh administrator. The command generates a password and prints it once to your terminal. An optional email is the second argument. The database permits one account with a blank email. Public signup cannot grant admin access. Set DATABASE_URL when targeting the hosted database and apply migration 003 first. Local setup applies the migration automatically.

Sign in at /login and open Moderation. The account page shows current commissions before suspension. Both suspension and restoration require a reason and confirmation. Admins cannot access another user's private proposals, email or unpublished media.
