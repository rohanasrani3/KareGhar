# KareGhar: who does what (deadline Sun 15 Nov 2026)

Code for a Billion hackathon, **Track 9: Livelihood for the Uneducated**.
Scoring is 4 × 25 points: size of problem, severity, quality of solution, and
**proven impact**. Proven impact is also tie-breaker #1, and it means *real
deployment data*. Real pilot data is how we win.

Customers post regional art, music, dance and craft demands. Artists send private proposals, and customers choose an artist. Work and payment happen directly between participants. Uploading the finished work marks the demand Completed and enables the owning customer's rating; there is no separate customer approval of the finished work. The customer independently chooses whether to publish it.

Current product decisions and exact copy are recorded in [../CHANGELOG.md](../CHANGELOG.md) and [../AGENTS.md](../AGENTS.md). [API.md](API.md) maintains the action/read contracts, and [EXPERIENCE-QA.md](EXPERIENCE-QA.md) records local checks and hosted-release limits. Use demand, proposal and Work history in the interface; the main navigation says Find Demand and the page/footer say Demand board.

## Hard eligibility (any one missing = not judged)
- [ ] Built in **AgentFoundry.me** (the official IDE). Check how it wants repos imported or committed.
- [ ] Deployed to a cloud by 15 Nov
- [ ] Public GitHub repo for *our code*, MIT licence, README with setup steps
- [ ] 2–3 min demo video or live link
- [ ] Submission issue filed at github.com/karlmehta/code-for-a-billion, **with the track set to 9**

## Split

### Frontend (Rohan)
Owns the bilingual marketplace, profile pages, discovery filters, accessible UI and contract types.

### Teammate A: Backend / Platform
Owns Auth.js credentials, database migrations, storage, server-side authorization and deployment. See AGENTS.md and docs/API.md for current contracts.

### Teammate B: Media + Pilot
Coordinate one customer, three demands and two or three artists. Leads include local cafés, hotels, event planners and family businesses. Collect pilot feedback, agreed fees and evidence with participant permission. Customers decide whether to publish submitted outputs. Impact records selected demands and agreed fees; it does not verify delivery or payment, and sample fees must not be presented as real earnings.

## Hand-offs
- Wed 11 Nov: confirm the pilot customer and three requests; prepare live storage and authentication.
- Sat 14 Nov: target three demands with finished submissions and record the demo with real pilot data.
- Sun 15 Nov (before noon IST): file the submission issue.
