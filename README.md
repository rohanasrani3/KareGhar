# KareGhar

**Empowering artisans. Enabling businesses.**

KareGhar connects customers with artists working in India's folk art, music, dance and crafts. Customers post a **demand** describing what they need; artists respond with private **proposals**. Browse artists and demands, explore portfolios, and switch between English and Hindi.

**Post a demand (In progress) → Accept a proposal (Completed) → Upload finished work → Rate and optionally share**

## For artists

1. **Create an artist account.** Sign up, then sign in. Provide a public contact so customers can reach you; your login email stays private.
2. **Build your portfolio.** Add work with its art category and form using an upload or external link. Complete your profile with a bio, photo and relevant links.
3. **Find a demand.** Open **Find Demand**. It shows **In progress** by default; choose **All statuses** to include demands where a proposal has been accepted. Review the brief, budget, deadline and required output.
4. **Send a proposal.** Describe your approach and timeline, choosing the offered budget or your own quotation. Track it under **In progress** in **Work history** until the customer accepts a proposal.
5. **Get selected.** Discuss scope, price, timing and payment with the customer. When they accept your proposal, the demand becomes **Completed** and finished-work upload becomes available.
6. **Submit finished work.** When ready, upload the requested file, or supported evidence for physical work or a live performance, in Work history (up to 4 MiB). This lets the customer rate you.

Demands with submitted finished work contribute to your artist ranking, including private work. Proposal acceptance alone, portfolio uploads and star ratings do not change that ranking.

## For customers

1. **Create a customer account.** Sign up, sign in and complete your profile. Your contact is public; your login email stays private.
2. **Post a demand.** Add a title, brief, art category/form, budget, deadline and output format. Include a reference image if helpful. The demand starts **In progress**.
3. **Review proposals.** Open Work history to compare artists' approaches and quotations. Visit their portfolios and discuss details privately.
4. **Choose an artist.** Agree on the terms, then accept their proposal. This locks the quotation and immediately marks the demand **Completed**.
5. **Follow the work.** Keep the conversation in Work history. Before finished submission, you may cancel the selection with a reason; the demand returns to **In progress** and the earlier history is retained.
6. **Rate and share.** After the artist uploads the finished work, give a 1–5-star rating, editable later, and choose whether to publish the finished work or keep it private.

Work and payment are arranged directly between you and the artist. KareGhar does not handle payments.

## Proposals and Work history

Each artist can send **one private proposal per demand** and edit it for **15 minutes**, while it remains active and the demand is **In progress**. Other artists cannot see that proposal or quotation.

**In progress** means the demand is open for proposals: the customer has not accepted an artist yet, even if proposals have already arrived. **Completed** means a proposal was accepted; finished-work upload happens afterward.

Open **Profile → Work history** to follow your posted demands or sent proposals:

- Browse **All activity**, or filter by **In progress**, **Completed** or **Unread**.
- Open a demand for its proposals, quotations, deadline, messages, activity timeline and finished submission.
- Customers have a separate private conversation with each proposing artist; artists see only their own thread.
- Finished files stay private to the customer and selected artist until the customer publishes them. The customer can hide them again later.

Listings marked **Sample** demonstrate the product and do not accept proposals. Samples contribute to rankings, ratings and Impact; their displayed fees are fictional.

## Try it locally

With Node.js 24, run these commands from the project directory:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000) and create separate artist and customer accounts to try both journeys.

Contributor and deployment guidance lives in [AGENTS.md](AGENTS.md). See [API contracts](docs/API.md) and [validation notes](docs/EXPERIENCE-QA.md) for technical details.
