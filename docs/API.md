# KareGhar application interfaces

Public JSON reads use GET. Discovery pages and API handlers share the server market queries. Authenticated forms use Next.js Server Actions and Auth.js cookies. Caller identity always comes from `viewer()`; URL/form fields cannot choose another account's privileges.

This file describes the current contract. [../CHANGELOG.md](../CHANGELOG.md) records the approved UI/copy changes; [EXPERIENCE-QA.md](EXPERIENCE-QA.md) records verification and deployment limits.

## Discovery and media

| Endpoint | Response |
| --- | --- |
| `/api/forms` | Current forms with `id`, `category`, English `name` and Hindi `hi`. |
| `/api/talent?category=&form=` | Artists ordered by demands with a finished submission in the requested overall/category/form scope. `artFormId` is also accepted. Sample artists participate in pilot rankings and retain their sample marker. The current artist's own card is omitted after ranking, preserving ranks for other viewers. |
| `/api/commissions?category=&form=&status=` | Public commission cards; only `finding` and `done` are discoverable. `progress` produces no public directory results. A signed-in customer's own briefs and an assigned artist's own jobs are omitted; they live in history. |
| `/api/commissions/{id}` | Commission detail with authorized `output` or an empty string. Accepted demands are publicly discoverable even before submission; private messages, quotations and unpublished files remain participant-only. Unknown or inaccessible IDs return 404. |
| `/api/people/{handle}` | Public identity, company, social links, optional photo, bio and explicitly provided contact text. Login email, password/session state and deleted/suspended profiles are never exposed. |
| `/api/media/{key}` | Authorized bytes; 404 for inaccessible/missing files, 503 for unavailable storage. Profile photos and uploaded portfolio media are public while their account is active. Reference images are public with visible briefs; participants retain reference access through history. Finished submissions require participation or explicit customer publication after submission. Archived submissions stay private to their original artist and customer. Every read rechecks access and returns `private, no-store`. Single `Range: bytes=…` requests return 206 with `Content-Range`; invalid/unsatisfiable byte ranges return 416. |
| `/api/auth/*` | Auth.js Credentials sign-in, session, CSRF and sign-out endpoints. |

`Commission` includes `original_fee`, scoped `fee`, `output_type`, `reference`, `deadline` (ISO calendar date, or empty for legacy records), creation/update/selection/submission timestamps, customer public contact, and assigned artist identity/contact. Only the customer and assigned artist receive the agreed selected quotation as `fee`; other readers, including unselected proposers, receive the original public budget. `commissionColumns(viewerParameter)` accepts only a server-owned `$1` or `$5` SQL placeholder and applies this projection consistently to discovery and history. Output values are private storage keys, or trusted static `/seed/…` paths for backend-defined samples. UI code must not invent public media access from an arbitrary client-supplied path.

`directoryFilters(catalogue, params)` normalizes discovery-page parameters, validates category/form pairs and status, infers the category of a valid form, and handles repeated or malformed query values without passing arrays into SQL. The default Demand board status is In progress; `status=all` opts into All statuses. Pending-selection counts are labelled In progress in Impact and moderation; uploaded-output galleries use Finished work. For status values, `finding` means In progress before proposal acceptance, and `done` means Completed on acceptance.

## Shared presentation and assets

| Path or surface | Current behavior |
| --- | --- |
| `/kareghar-logo.png` | Public full original header logo; localized accessible home-link label and responsive proportional sizing. |
| `/kareghar-icon.png` | Public 256×256 transparent crop containing only the original house mark. Declared as the PNG icon in root metadata. |
| `/favicon.ico` | App favicon with transparent 16, 32, 48, 64, 128 and 256px PNG frames; also declared as the shortcut icon. |
| `/credits` | Photographer/source/licence catalogue linked from the bottom of the shared footer. Attribution is not overlaid on homepage photographs or craft tiles. |
| Portfolio | A populated portfolio has the top-right Add work button; the bottom add-more tile is removed. Empty portfolios retain Add your first work. Action permissions and edit/remove behavior are unchanged. |
| `parseProfileLinks(storedJson)` | Returns distinct HTTP(S) links without embedded credentials, or an empty array for malformed legacy JSON. Profile, public-profile and moderation views use the same parser. `SocialLinks` also filters unsafe inputs before rendering. |

The homepage process describes contact before selection and customer rating after finished submission. The shared footer contains the approved marketplace/Sample data paragraph. Exact wording is in the change log; interface copy has English/Hindi equivalents.

## Impact definitions

The page queries `demands`, including private demands and tagged samples, with no sample exclusion. Its English/Hindi notice explicitly says the totals include real activity and sample data impact and that sample fees are fictional. Selected demands have a non-null artist and status `done`. Agreed demand value sums their fees; selected-demand count counts them; artists connected counts distinct selected artists. Customers posting demands counts distinct customers across all posted demands. Supporting rows show posted, Finding and selected counts, plus average agreed fee (value / selected count, or an em dash for zero).

There is no completed-demand total, completion percentage or fee-per-completed-demand metric. Selection adds a current connection, cancellation removes it, and submission/rating does not itself change connection totals. These values record agreements, not verified payments, income or delivery. Samples remain clearly identified as fictional.

## Account and portfolio actions

All actions below are exported by `src/server/actions.ts`. The shared signature is `(previousState: string, data: FormData) => Promise<string>`, except redirecting success paths and `switchLanguage(data)`.

| Action | Form fields | Result |
| --- | --- | --- |
| `register` | `username`, `name`, private `email`, required public `contact` (1–240 characters after trimming), `password`, `role=artist|customer` | Rejects missing, blank or oversized contact before creating an account. Stores the explicitly supplied public contact separately from the private login email, creates one role and redirects to login. Artist signup carries `onboarding=artist`, leading to portfolio setup after sign-in. Existing accounts do not need a data migration. |
| `updateProfile` | `name`, private `email`, `company`, optional `bio` (up to 2,000 characters), public `contact` (up to 240), `social_linkedin`, `social_instagram`, `social_facebook`, `social_x`, `social_youtube`, `linksExtra` JSON array, optional `photo`, `removePhoto=on` | Updates the current account. Social URLs must match their platform. Legacy `links` textarea input is also accepted. Photo uploads override removal; removal clears the photo. JPEG/PNG/WebP only, at most 5 MiB. |
| `changePassword` | `current`, `password` | Verifies the existing password, rotates the hash and session revision, then redirects to login. Every existing session becomes invalid. |
| `deleteAccount` | `current`, `confirm=DELETE` | Verifies the password and rejects selected demands without a finished upload, even though their status is Done (`active` feedback). Anonymizes the account and invalidates sessions, removes its public portfolio/profile and uploaded portfolio/photo files, and redirects to login. Shared commission/proposal/message history remains for the other participant. Admin self-deletion is unavailable. |
| `addWork` | `title`, `category`, `formName`, `url` or uploaded `file` | Creates an owned portfolio item, resolving or registering the form within its category. Files support image/audio/MP4 up to 5 MiB. A supplied upload takes precedence over a URL. |
| `updateWork` | `id`, same fields as `addWork` | Edits only the current artist's item. An existing owned upload URL can be retained; arbitrary new internal media keys are not accepted. Replacing an uploaded file removes the superseded file. |
| `deleteWork` | `id` | Removes only the current artist's item and its directly owned uploaded media. It does not alter commission completion history or rankings. |
| `switchLanguage` | `lang=en|hi` | Stores the site-wide cookie and refreshes the layout. |

Usernames remain case-sensitive and allow 3–40 ASCII letters, digits or underscores. Registration and password changes require 6–128 characters. Normal successful login goes to `/`; artist onboarding goes to `/profile?tab=portfolio&onboarding=1`.

Profile photo changes and account deletion read the current photo key after acquiring the account lock, so cleanup includes a photo replaced by a concurrent request. Portfolio edits compare the existing file URL again when updating; a concurrent replacement returns `conflict` and removes any losing upload. Refresh the portfolio before retrying that edit.

`takeAttempt(key)` atomically reserves one of 12 attempts in a 15-minute persistent budget; `clearAttempts(key)` clears that budget after successful verification. Budgets are shared by application instances. Credentials login uses `login:{username}`; password changes and account deletion share `password:{accountId}`. Exhausted password-action budgets return `limited`. Invalid stored password hashes fail authentication without exposing an exception. Auth navigation remains available when browser session storage is disabled.

`ActionForm` displays localized feedback for validation/permission failures, `limited` attempt budgets, and `unavailable` storage failures. Upload validation failures return `file`. A storage failure leaves the previous record intact.

## Demand workflow

`postCommission` accepts `title`, `brief`, `category`, `form`, optional `otherForm`, `fee` (whole INR, 0–100,000,000), required `output_type`, required `deadline` (ISO calendar date, today or later in India Standard Time), and optional `reference` image. `form=__other__` registers `otherForm` in the selected category. Output types are `audio`, `video`, `live`, `physical`, `image`, and `other`. A new commission starts in In progress (`finding`, before proposal acceptance), preserves its original budget, records a creation event and redirects to `/profile/history/{id}`. The customer accepts a proposal in private Work history using `select`; this selects the artist, locks the quote and immediately marks the demand Completed (`done`).

`commissionAction` always takes `id` and `action` plus the fields below:

| Action | Additional fields | Authorized transition |
| --- | --- | --- |
| `propose` | `message`, `pricing=offered|quote`, custom `quote` when applicable, `acknowledged=on` | One private proposal per artist per real Finding commission. Offered pricing copies the original budget; custom pricing requires an explicit valid number. Contact/scam acknowledgment is enforced server-side. |
| `editProposal` | Same fields as `propose` | Only the author, only while the brief is Finding, only for an active proposal, and only within 15 minutes of its original server timestamp. Keeps `initial_quote` and the original creation time, records each update; an expired edit returns `expired`. |
| `select` | `proposal`, `acknowledged=on` | Only the customer selects an active proposer. The agreed fee becomes the proposal's latest quotation; the original brief budget remains unchanged. State becomes Done immediately and the brief remains publicly discoverable. No submission date or output is fabricated. |
| `cancel` | `reason` (1–4,000 characters) | Only the customer, after selection (Done) and before finished submission. Cancels the selected proposal and reopens Finding at the original budget. Preserves quotations, messages and any previous submitted output in private history. A cancelled proposal cannot be reselected or edited. |
| `submit` | `file` | Only the assigned artist, only Done, with no existing submission. Accepts JPEG/PNG/WebP/WAV/MP3/MP4 up to 5 MiB, verified from file signatures. Image/audio/video demands require a matching media format; physical/live/other demands accept any supported proof file. Submission records the output and submission timestamp, keeps Done, counts toward ranking and enables the customer’s rating. The file remains private. |
| `rate` | `rating` (integer 1–5) | Only the owning customer, only on a Done demand with the artist’s nonempty finished submission and assigned artist. Creates or edits the single rating for that demand. Session, sample and pause guards apply; artist/customer IDs come from the locked demand. Does not change ranking or visibility. |
| `visibility` | `public=on` or omitted | Only the customer, only after finished submission. Publishes or hides the finished output without changing ranking eligibility. |

Transitions and their events are committed together. Demand row locks serialize conflicting selections, cancellations, edits and deliveries. `lockAccounts(query, ids)` locks accounts in sorted order after the demand lock; `currentSession(query, account)` checks session/password revision and availability again within mutations. Selection rechecks the proposer's availability after acquiring the locks. Failed uploads/transitions clean up newly uploaded unreferenced files. Samples cannot sign in or take part in mutations.

The workflow has three steps: demand posted, artist selected, finished work submitted. Proposal acceptance marks Done immediately; finished-work upload happens afterward without another status transition. Public sharing and customer rating are independent choices after submission. Impact measures selected demands and their agreed fees, unique selected artists and posting customers; it does not display a completion total or rate, or claim verified delivery/payment.

### Customer ratings and naming

The interface calls customer requests **demands**, artist responses **proposals**, the discovery page **Demand board** (with **Find Demand** in the main navigation), and the private workspace **Work history**. Existing `/commissions` URLs, Server Action names and TypeScript identifiers stay compatible. Physical SQL storage follows demand terminology after migration 008.

Work history offers **Rate artist** only after the artist submits the finished work. Selecting a proposal alone does not enable rating. `Commission.rating` is an integer or `null`. The score is readable only by the customer/assigned artist or when the finished output is publicly shared; hiding the output hides its individual score. `publishedWorks` includes the visible rating next to each finished piece. Unrated work is labelled explicitly, never treated as zero stars.

`artists` and `/api/talent` include `rating_average` (number or null) and `rating_count`. `artistRating(artistId)` returns the same aggregate for public and own profiles. Each completed rated demand contributes once, including private work; editing updates the score rather than adding a rating. Ratings are independent of completion-based ranks. Backend sample fixtures include fictional ratings on submitted work; sample demands cannot receive ratings through user actions. `rated` events notify only the assigned artist and customer without placing the score in the event detail.

Apply migrations 001–009 in order before deploying this code to PostgreSQL; apply each migration once. Historical migrations 001–008 remain unchanged. Migration 006 creates the ratings table with row-level security and revoked browser/public access; 007 marks existing in-progress demands with submitted output as Done, preserving output and visibility. Migration 008 renames `commissions` → `demands`, `commission_state` → `demand_state`, `commission_events` → `demand_events`, `commission_ratings` → `demand_ratings`, dependent `commission` foreign-key columns → `demand`, and `accepted_at` → `legacy_accepted_at`. It also aligns indexes and PostgreSQL constraint names, preserves records and table access controls, and revokes public/browser access to the recreated view. Migration 009 converts selected legacy `progress` demands to `done` (unassigned legacy rows become `finding`), preserving all other fields and history. It does not mark an upload as submitted. See [the rollout steps](DEPLOYMENT-009.md). Local SQLite upgrades automatically and idempotently. The legacy timestamp column and audit events remain stored but are not exposed as workflow steps, unread notifications or contract fields.

## Demand counts and sample contact maintenance

Impact counts every row in `demands`, including pending-selection, accepted and paused records. Anonymous, unfiltered discovery shows both unpaused states, including accepted demands without uploads; signed-in discovery additionally hides the viewer's own posted/assigned demands. Search filters can narrow it further. A lower board count does not establish duplicate or dirty data. Check the hosted database without changing records:

```sql
SELECT status, COUNT(*) AS total,
       SUM(CASE WHEN paused=1 THEN 1 ELSE 0 END) AS paused
FROM demand_state GROUP BY status ORDER BY status;
```

Signup's required public contact is application validation, not a new database column: migration 004 already added `accounts.contact`. Existing real accounts may still have blank contact, and profile editing permits clearing it. Their owners can supply a public contact through Profile; never expose their private login email as a backfill.

For fictional sample accounts, run [the contact-only repair](../scripts/backfill-sample-contacts.sql) in the production Supabase SQL editor after migrations 001–008. It fills only blank contacts on non-deleted sample accounts without admin grants, using `username@example.invalid`. These addresses cannot receive messages. Existing contact values, real/admin/deleted accounts, private emails and demand records are unchanged. Re-running is safe; the final missing-contact count should be zero.

The seeder now preserves existing contacts and supplies fictional addresses for new samples. A separate contact-version marker patches previously seeded databases without replaying a completed catalogue. The SQL repair itself never adds catalogue records; enabling a full sample seed on an older or incomplete catalogue may add missing sample demands. Production changes require running the SQL against production; editing source alone does not update the hosted database.

## Private history, conversation and notifications

Server reads in `src/server/history.ts` accept only a server-authenticated account ID:

- `history(viewerId)` returns the account's posted, assigned or proposed demands, including cancelled selections, original/scoped fees, timestamps, own proposal summary and unread count.
- `historyDetail(id, viewerId)` returns `{ commission, proposals, events, messages }`, or `undefined` for a nonparticipant. Customers see proposals and separate conversations with each artist; artists see only their own proposal, conversation and targeted events. Other applicants never receive a different artist's private submission or quote events.
- `unreadCount(viewerId)` counts unseen events/messages from other participants across the account's history.

Proposal reads include `unavailable` for a suspended or deleted proposer. Existing correspondence remains readable to its participants, while selection and messaging controls are disabled for unavailable participants; action authorization enforces the same checks.

`src/server/history-actions.ts` exports:

| Action | Fields | Behavior |
| --- | --- | --- |
| `sendMessage` | `id`, thread `artist`, `body` (1–4,000 characters) | Sends only within an existing customer–proposer thread, including its cancelled selection history, or to a legacy selected artist. Checks both sender/session and artist availability. No admin override. |
| `markHistoryRead` | `id`, `seenAt` epoch milliseconds | Explicit participant-only mutation. The cutoff is capped at server time and never moves backward. GET/render does not mark history as read. |

The history UI captures a cutoff before fetching history and offers an explicit mark-read button so newer concurrent arrivals remain unread. Work history is under `/profile/history` and `/profile/history/{id}`; it opens to All activity by default so newly accepted demands remain visible, with In progress (pending selection), Completed and Unread available as filters. A customer's completed unrated submission links to Rate artist. The public Demand board opens to In progress by default; selecting All statuses includes accepted demands. A completed demand without output shows a pending-upload message, not a finished-submission claim. Times in UI are formatted separately from epoch-millisecond storage.

## Pilot data, rankings and storage

Rankings count one Done demand with a nonempty finished submission, including private work. Submission itself makes a demand eligible. Adding unrelated portfolio pieces alone does not inflate ranks. Ties share a rank, and zero completed submissions have no displayed rank. The pilot includes clearly marked fictional samples in discovery, rankings and impact; 34 accepted sample demands have generated outputs and four accepted samples still have no submission. Sample account passwords remain empty and login requires `sample=0`.

Apply `migrations/004_experience.sql` and then `migrations/005_deadline.sql` once to PostgreSQL after the existing migrations. They add account/profile fields, commission specifications/timestamps and deadline, quotation history fields, events, private messages and read markers, then recreate the account/commission state views with deletion handling. Existing commissions retain an empty deadline because no date was recorded. New private tables have row-level security enabled and public/browser roles revoked. The local SQLite initializer applies each upgrade once inside a transaction and is safe to rerun. Local data defaults to `.kareghar`; `KAREGHAR_DATA_DIR` can isolate development or QA database/media storage.

Run `node scripts/test-experience.mjs` for migration, authorization and lifecycle integration checks against SQLite. The harness executes the real action/read modules with isolated session/framework/storage boundaries. It does not substitute for a PostgreSQL deployment migration rehearsal or browser smoke testing.

Run `npm run test:security` for persistent login/current-password budgets, invalid hashes, session invalidation, upload signatures and requested formats, private media keys, byte ranges, missing files and deleted-account moderation. `mediaResponse(key, request?)` handles authorized full/range responses; authorization stays in the route and is repeated for every request.

## Moderation

`/admin` and `/admin/{account-id}` require an active admin session. Dashboards expose public profile fields, including bio and explicitly supplied public contact, and demand metadata. Missing contact shows a localized “Not shared yet” fallback. Login email and credentials are excluded. Moderation grants no access to private proposals, messages, selected quotations, individual private ratings or unpublished media.

An admin created before migration 004 retains its account ID, username, password hash and `admin_grants` entry through migrations 004–008. New profile fields receive their normal empty defaults. Existing admins can log in and edit a profile with blank email/contact; the mandatory public-contact rule applies to customer/artist signup. Password changes invalidate old admin sessions while retaining the grant after a fresh login. This compatibility update needs no new schema migration.

Account summaries distinguish deleted accounts from reversible suspensions. Deleted accounts have no restoration control. Demand summaries link to detail only when public discovery permits access; private or paused work remains metadata only.

`moderateAccount` takes `target`, `version`, `action=suspend|restore`, `reason` (1–4,000 trimmed characters), and `confirm=on`. It records actor, target, reason, time and transition atomically. Suspension invalidates sessions, blocks login, hides public listings and pauses related actions. Restoration retains historical records and requires a new login. Deleted accounts are ineligible for suspension/restoration and remain unavailable.
