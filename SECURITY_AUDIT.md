# VoteSetu Voting Security Audit

Date: 2026-09-18
Scope: Flask website, VoteSetu SQLite voter registry, and local RIDTP Auth integration.

> **Historical snapshot:** These observations and the 17-test result below describe the code and local setup exercised on 2026-09-18. They are not a current penetration test, production certification, or guarantee that later code has the same behavior. Run the current regression suite and repeat security testing after material changes.

## Attack simulation

The following requests were exercised against the website API:

| Attempt | Result | Reason |
|---|---:|---|
| Register without RIDTP login | Blocked (`401`) | `/voters/register` requires the HttpOnly RIDTP session cookie. |
| Cast without RIDTP login | Blocked (`401`) | `/votes/cast` requires the HttpOnly RIDTP session cookie. |
| Register with an invalid public key | Blocked (`400`) | The server parses and validates the RSA public key before storing it. |
| Register a second credential for one RIDTP identity | Blocked (`409`) | The local registry has a unique `ridtp_rid` index. |
| Register with a fake browser-supplied name | Fixed | The stored name now comes from the verified RIDTP profile, not the request body. |
| Cast without State, City, and Area | Fixed (`400`) | The server validates ballot geography; UI-only validation is not trusted. |
| Cast with an unknown area | Fixed (`400`) | The area must be in the configured Greater Noida location set. |
| Cast with another voter ID | Blocked (`403`) | The voter row must belong to the signed-in RIDTP subject. |
| Cast without an eligible government-roll record | Blocked (`403`) | The current election roll must contain an eligible record linked to the RIDTP subject. |
| Cast after government eligibility is revoked | Blocked (`403`) | Corrected roll imports replace the previous decision before casting. |
| Cast using an old RIDTP session credential | Blocked (`403`) | The registered browser credential must match the current RIDTP session hash. |
| Cast from a cross-site browser request | Blocked (`403`) | Voter mutation routes require a matching same-origin `Origin` header. |
| Fetch another voter's receipt/status | Blocked (`401/403`) | Receipt retrieval requires the owning verified RIDTP session. |
| Cast with another private key | Blocked (`403`) | The ballot signature does not verify against the registered public key. |
| Replay a valid ballot | Blocked (`403`) | The registry atomically marks the voter as having voted. |
| Cast a second ballot | Blocked (`403`) | One local voter credential can be used only once. |
| Cast with an invalid candidate | Blocked | `Election.cast_vote` checks the candidate allowlist. |
| Cast a stale signed ballot | Blocked | The election enforces the ballot freshness window. |

## Why the current bypasses fail

1. A request cannot reach local registration or voting without a valid RIDTP session and same-origin browser request.
2. Registration and voting require an active RIDTP profile with `VERIFIED` or `VERIFIED_HIGH` trust band.
3. The current election's imported government roll must link the RIDTP subject and mark it eligible.
4. The public key is generated in the browser and the non-extractable private key is not uploaded or downloaded.
5. The local database binds one public-key voter credential to one RIDTP subject and one RIDTP session.
6. Every vote is checked against the registered public key, candidate list, timestamp, government-roll location, and one-vote flag.
7. Corrected government-roll imports replace old decisions, so revocation blocks future casts.
8. The public ledger stores an anonymous ballot token and encrypted candidate, not `voter_id` or plaintext candidate choice.
9. The receipt proves inclusion of the encrypted ballot without revealing the selected candidate, and receipt lookup is owner-authenticated.
10. The private key is non-extractable and scoped to the active browser session. Refresh preserves the session; a new RIDTP login rotates the public key, and rotation is refused after voting.

## Remaining limitations

The tested controls reduce several request-level attacks, but do not establish
official voter eligibility, operator anonymity, or resistance to coercion.

## Practical real-world bypasses

These are not solved by stronger hashes or signatures. They require election
policy, independent oversight, and changes to the voting protocol.

| Risk | Severity | Current status | Required control |
|---|---:|---|---|
| Vote buying or coercion | Critical | Not solved | Do not publish a voter-linked candidate choice or a receipt that proves how someone voted. Remote voting also needs a coercion policy, such as supervised polling or a carefully designed revote mechanism. |
| Family, employer, landlord, or local-official pressure | Critical | Not solved | Provide a private voting environment and prohibit observers from demanding screenshots, voter IDs, or receipts. Cryptography alone cannot make a remote voter free from physical pressure. |
| Election-official insider changes candidates or resets the election | Critical | Prototype admin key is bearer-only | Use separate election-authority roles, dual approval, signed append-only admin actions, immutable election configuration, and independent monitoring. |
| Fake or politically manipulated voter enrollment | Critical | Demo only | Use a signed authority roll, independent source verification, duplicate/deceased-voter reconciliation, correction deadlines, and an appeal process. The local RIDTP directory is not proof of citizenship or entitlement. |
| Stale or wrongly imported roll disenfranchises a real voter | High | Partly handled | Require signed roll versions, monotonic version checks, import review, before/after counts, anomaly alerts, and a human appeal path before activation. |
| Lost phone, cleared browser, shared computer, or inaccessible device | High | Not solved | Define identity-verified credential recovery and assisted voting. Recovery must revoke the old credential and be audited without allowing a second ballot. |
| Disability, language, literacy, or connectivity barriers | High | Not solved | Provide tested accessible interfaces, lawful assistance, offline/in-person alternatives, and a way to report and resolve failed submissions without exposing the ballot. |
| Service outage or admin failure near the deadline | High | Not solved | Use redundant services, tested backups, a published election clock, queue durability, incident procedures, and an independently verifiable close-of-polls event. |
| Polling-area boundary or candidate-feed error | High | Demo geography/candidates | Load signed official boundary and candidate feeds, validate constituency membership, preview changes, and obtain authority approval before opening the ballot. |

buying scheme. The demo now removes that direct link and encrypts the choice
### Ballot privacy: current behavior and remaining risk

An earlier implementation directly exposed the voter credential and candidate
in the public chain and receipt. The current implementation instead puts a
random `ballot_id`, nonce, timestamp, and AES-GCM-encrypted candidate in the
ledger. A receipt returns that encrypted vote and its Merkle proof; it does not
return the plaintext candidate. The receipt route requires the matching
verified RIDTP identity.

This removes the direct voter-ID/plaintext-choice link from the public ledger,
but it is **not anonymity from the operator**: the server-side voter registry
stores the voter's `ballot_id`, and the running election process holds the key
that decrypts candidates. The public ledger also publishes ballot timestamps.
A production design must separate eligibility from ballot casting with an
election-scoped anonymous entitlement and use independently controlled
decryption after polls close. A Merkle inclusion receipt alone must not prove
how a voter voted.

### 1. No official electoral-roll verification

A user who can create a qualifying account in the local RIDTP Auth database can still authenticate and receive a verified demo profile. That account can then cast one ballot. This is not a cryptographic bypass; it is an identity/eligibility boundary.

To prevent that class of fake vote, production VoteSetu must consume an authoritative election service or electoral-roll assertion that supplies at least:

- verified voter eligibility for the selected election;
- the permitted State, City, Area, constituency, or ward;
- an election-specific one-time eligibility token or signed assertion;
- revocation and audit status from the election authority.

The planned normalized voter-roll and candidate-feed boundary is documented in [GOVERNMENT_DATA_CONTRACT.md](GOVERNMENT_DATA_CONTRACT.md). It intentionally does not include real voter records until the authority supplies the approved format.

The current local RIDTP database is not a government identity provider and is not an official electoral roll.

### 2. Demo geography is not an official ward map

The Greater Noida areas in the application are configured demonstration choices. They are not proof that a voter belongs to a legal polling station or ward. Official delimitation and polling-station data must be loaded from the competent election authority before real use.

### 3. Prototype deployment boundary

VoteSetu currently uses Flask's development server, process-local rate limiting, and a local SQLite database. Production deployment needs HTTPS, a production WSGI server, durable shared rate limiting, backups, operational monitoring, and an independently reviewed election-authority integration.

The demo ballot encryption key is held in the running election process. A real
deployment must store it in an HSM or equivalent threshold-controlled key
service, with audited decryption only after the legally defined close of polls.

## Files implementing the controls

- `app.py`: RIDTP session, trust-band, identity ownership, and location checks.
- `votesetu_core/registry.py`: SQLite `ridtp_rid` binding and uniqueness constraint.
- `votesetu_core/election.py`: signed ballot, candidate, timestamp, and one-vote rules.
- `static/js/register.js`: login gate and non-extractable browser credential creation.
- `static/js/vote.js`: loads the browser credential and submits the selected location with the signed ballot.

## Validation result

- Government-roll eligibility, revocation, session binding, and cross-site request checks: passed.
- Full VoteSetu security suite at the time of this audit: 17 passed.
