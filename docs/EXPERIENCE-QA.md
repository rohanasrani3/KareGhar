# Marketplace experience validation

Validated locally on 15 November 2026 with Node 24. The initial walkthrough used `.kareghar/qa-experience`; rating and submission checks used `.kareghar/qa-ratings`. Test accounts and uploads stay in these ignored local directories; hosted accounts were not used. [../CHANGELOG.md](../CHANGELOG.md) records the final product decisions and wording, while this file distinguishes checks actually performed from outstanding release checks.

## Automated checks

- Dependencies: the initial baseline `npm ci` completed. A later clean reinstall hit a Windows lock on loaded native modules; `npm install` restored the dependencies successfully.
- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript and route generation.
- `npm run test:experience`: passed using the application actions and read modules with an isolated SQLite database and test session/storage adapters.
- `git diff --check`: passed; Git reports normal Windows line-ending conversion notices.

The regression harness covers migration upgrades and repeated initialization, idempotent pilot seeding, offered/custom quotes and blank-quote rejection, immutable initial quotations, the 15-minute editing window, participant/owner authorization, cancellation and archived history, private messages and media, finished-submission ranking eligibility, portfolio ownership/cleanup, profile/photo changes, and account deletion/session invalidation.

## Browser walkthrough

- Artist and customer signup/login; artist onboarding opens the portfolio tab.
- Add portfolio work through a modal; editing and Cancel preserve the saved entry.
- Profile Cancel discards draft changes; saving bio and explicitly public contact updates the read view.
- Create an audio brief; format-specific guidance updates; posting opens private History.
- Artist sends a custom quotation, edits it within the allowed window, and retains the initial quotation in History.
- Customer and artist exchange private messages; unread badges appear; marking updates as read clears the badge.
- Customer selects the artist with the contact-before-work acknowledgment; the agreed fee matches the edited quote.
- Artist uploads a WAV submission; an inline audio player appears. The current workflow marks the demand Completed at submission.
- Discovery excludes the customer's own commission; public status choices include open and completed work only.
- Category filtering and Clear filters reset both category and dependent form controls.
- Public portfolio slideshow advances and switches to a grid.
- Hindi/English switching, mobile profile/portfolio dialogs, 320px and 390px narrow layouts, 768px discovery, and 1280px history/gallery layouts checked. Fixed narrow Hindi header overflow, impact-number wrapping, secondary-button styling and shared unread-badge styling during this pass.

## Deployment boundary

Publishing source does not release the application or mutate a hosted database. Apply outstanding migrations in order through `migrations/008_demand_naming.sql` before deploying this application version. Existing installations with migrations 001–003 need 004–008, each once. The audit also rehearsed PostgreSQL migrations, RLS/grants and application queries using isolated in-memory PGlite with stub Supabase roles/storage metadata. Actual hosted permissions, the private Supabase Storage path and simultaneous PostgreSQL transactions still require deployment-environment checks. External portfolio URLs depend on the remote host permitting embedding. Synthetic audit accounts and uploads were kept in isolated local directories. The latest verification scope and operational rules are in AGENTS.md; the dated walkthroughs below retain their original context.

## Customer ratings and demand terminology, 15 November 2026

- `npm run test:experience` passes with rating authorization, integer bounds, rejection before finished submission, sample/paused guards, one rating per demand, rating edits, two-demand averages, per-work visibility, and unchanged completion ranking counts.
- `npm run lint` and the production build pass, including TypeScript and route generation. The clean dependency reinstall encountered a Windows lock on loaded native libraries; `npm install` restored dependencies successfully. Build generation required running outside the filesystem sandbox.
- Browser checks used the production build on port 3107 and an isolated `.kareghar/qa-ratings` SQLite/media directory. Synthetic QA accounts and ratings were never added to hosted data.
- Checked saved customer ratings in Work history and on finished work. Saved a 5-star rating; Work history and the delivered work show it. A profile with 4-star and 5-star demands displays **4.5/5 (2 ratings)**; only the published work appears in its public gallery, with its own 4-star score.
- Checked the 44px star controls at desktop and 390px phone width, including Hindi labels/help and restoration to English. Confirmed the new homepage process copy, exact footer paragraph, and bottom Photo credits line without credits over the photographs.
- Scanned interface strings: no remaining commission/brief/project/application terms for customer demands and artist proposals. Backend identifiers and existing URLs stay compatible.
- Impact now reports selected demands, artist connections and agreed demand value. Completed totals and completion rate have been removed.
- Apply `migrations/005_deadline.sql`, `migrations/006_ratings.sql` and `migrations/007_submission_workflow.sql` after migration 004 before a hosted release. PostgreSQL migration/RLS verification remains a deployment check; local initialization is idempotent and tested.

## Submission without customer approval, 15 November 2026

- The real-action integration harness verifies that selecting a proposal alone cannot enable rating or sharing. Assigned-artist submission marks Done, immediately enables customer rating and ranking, and stays private. Duplicate/unauthorized uploads and the removed workflow action are rejected.
- Migration checks preserve existing output and sharing preferences, upgrade pending submissions, leave unsubmitted demands in progress, and verify repeat initialization. Legacy finished-work approval events remain stored but are omitted from history and unread counts.
- Impact is rendered against the integration database: selecting a proposal increases connection count and agreed value; cancellation reverses them; submission does not change them. The rendered page has no completion rate or completed total.
- Browser checks on the isolated local preview confirm no rating form before submission, a three-step timeline, and successful saving of a 5-star customer rating on a submitted demand. Impact and its Hindi translation show the revised connection metrics. English was restored afterward.
- Lint, production build and the integration suite pass. No hosted database or deployment was changed.

## Portfolio, navigation and browser icon, 15 November 2026

- The portfolio follow-up removed the populated grid's bottom Add more work tile and unused styles. The blue top-right Add work button and empty-state Add your first work button remain. Lint and the production build passed; no separate new browser walkthrough was recorded for this small change.
- The main navigation was restored to **Find Demand** / **माँग खोजें**. The discovery heading and footer retain **Demand board** / **माँग बोर्ड**; proposal and Work history naming remain consistent elsewhere.
- Inspected the house-only crop of the original logo. The final 256×256 PNG keeps transparency and contains no wordmark/tagline. The ICO contains 16, 32, 48, 64, 128 and 256px frames.
- After the icon changes, `npm run lint` and `npm run build` passed. An isolated production preview on port 3108 served `/kareghar-icon.png` as `image/png` and `/favicon.ico` as `image/x-icon`, both with HTTP 200. Their bytes matched the project files.
- The rendered homepage included the PNG icon and ICO shortcut links. All six ICO frames decoded to their expected square dimensions and retained an alpha channel. The temporary verification server was stopped.
- No claim is made that a particular Chrome tab refreshed its cached icon; reopening the tab may be needed. No full workflow-suite rerun was needed for the asset/metadata-only icon change; that suite had passed after the submission and rating changes.

## Documentation handoff

The current rules, final copy, naming exception, portfolio controls, footer attribution, active logo/icon assets, rating privacy, impact formulas, migrations and release boundary are recorded in AGENTS.md, README.md, CHANGELOG.md and docs/API.md. Team and logo-exploration notes point to the current workflow/assets. Documentation-only changes are checked for relative-link validity, agreement with source and whitespace; they do not imply a fresh application build or browser walkthrough.
