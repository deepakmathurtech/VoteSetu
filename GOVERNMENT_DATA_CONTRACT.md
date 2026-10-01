# Government Election Data Contract

This document defines a proposed boundary for future official voter-roll and candidate feeds. The repository currently contains synthetic demo data only; no official authority feed or real voter information is integrated.

## Current implementation status

- `POST /admin/government-roll/import` imports a JSON file from the local demo inbox and requires the shared VoteSetu admin bearer key.
- Imported decisions are stored in a local SQLite government-roll table. `roll_sequence` rejects lower revisions and conflicting changes at the same revision; identical same-revision imports are idempotent.
- The importer does not verify a digital signature or otherwise authenticate who supplied the JSON. Revision checks prevent rollback but do not prove authority or accuracy.
- Candidate names, parties, symbols, and locations are placeholders. There is no official candidate feed.
- The public chain and receipt expose encrypted ballot data rather than voter IDs or plaintext choices, but the operator can link the registry's voter-to-ballot mapping and holds the running process's decryption key. This is not operator anonymity.

## Voter-roll input

The future adapter should normalize the government database into records like:

```json
{
  "election_id": "gbnagar-local-2027",
  "official_voter_id": "AUTHORITY-REDACTED-ID",
  "full_name": "Voter name from the authority",
  "state": "Uttar Pradesh",
  "district": "Gautam Buddha Nagar",
  "city": "Greater Noida",
  "area": "Official ward or polling area",
  "constituency": "Official constituency name",
  "eligible": true,
  "roll_version": "2027-final",
  "roll_sequence": 1,
  "source": "Official election authority"
}
```

Rules for the integration:

- The authority's `election_id` and `official_voter_id` are the eligibility keys; VoteSetu must not invent them.
- A RIDTP identity may register only when it is mapped to an eligible record for the selected election.
- State, district, city, area, constituency, and polling-station values must come from the authority's normalized roll, not a browser request.
- Raw voter-roll data must be encrypted at rest, access-controlled, audited, and retained only for the authority-approved period.
- Public receipts and the blockchain must never expose the official voter ID or the voter's personal details. They must not expose plaintext candidate choices or a voter-to-choice mapping either.
- Import must be versioned and idempotent so a corrected government roll can replace an earlier version without duplicating voters.
- `roll_sequence` is a positive signed 64-bit integer revision for one `(election_id, official_voter_id)`. Re-importing identical data at the same sequence is idempotent; changed data must use a higher sequence, and lower or conflicting same-sequence imports are rejected. This is an ordering rule, not a signature or source-authenticity check.

## Candidate input

Candidate information should arrive as a separate official feed:

```json
{
  "election_id": "gbnagar-local-2027",
  "candidate_id": "AUTHORITY-CANDIDATE-ID",
  "name": "Official candidate name",
  "party": "Official party or Independent",
  "symbol": "Official symbol name",
  "constituency": "Official constituency name",
  "manifesto_url": "https://official-authority.example/manifesto",
  "affidavit_url": "https://official-authority.example/affidavit",
  "photo_url": "https://official-authority.example/photo",
  "status": "approved",
  "source": "Official election authority"
}
```

VoteSetu should validate candidate IDs and constituency membership server-side. Candidate names, party labels, symbols, manifestos, affidavits, and photos should be displayed as supplied by the authority, with the source and publication/version timestamp visible to administrators and voters.

## Current prototype state

- The demo uses placeholder candidates in `app.py` through `CANDIDATE_DETAILS`.
- The demo uses placeholder Greater Noida areas in `VALID_BALLOT_LOCATIONS`.
- No official voter records or real candidate claims are stored in this repository.
- The web app generates a non-extractable private `CryptoKey` in the browser and stores it in IndexedDB; it sends only the public key and signatures to the server. It does not offer a PEM private-key download. Browser storage and same-origin script compromise remain in scope for a real threat model.
- The browser credential is scoped to the active RIDTP session. A page refresh resumes the same session credential; a new RIDTP login creates a new key and rotates the registered public key before voting.
- Rotation is atomic and is refused after a ballot has been accepted. This is the bank-style session boundary: a new session must re-establish a fresh signing credential.
- The current importer is admin-key protected and uses a versioned local roll table, but it accepts unsigned local JSON. The next integration should verify authority signatures, validate signed election/version metadata, add reviewed activation and append-only import audit events, and define key rotation and correction procedures before accepting official data.

## Recommended RIDTP voting flow

Assume every government-roll record is linked to an RIDTP Root Identity (`RRID`) before the election. The browser must never be allowed to assert this relation by itself.

1. The voter signs in through RIDTP.
2. VoteSetu's server requests a short-lived, election-scoped RIDTP assertion for an operation such as `canVoteFor2026`.
3. The server validates the assertion signature, issuer, election ID, constituency/area, expiry, active status, and revocation state. A client-supplied `true` value is never trusted.
4. RIDTP returns eligibility without exposing the RRID in the public ballot. The server creates a single-use, election-scoped voting entitlement.
5. The voter generates the ballot-signing key on their own device. The private key must not be generated or retained by the server.
6. The server stores only the public key or public-key fingerprint against the single-use entitlement. The public ledger should use a random election credential, not the RRID or government voter ID.
7. The ballot is signed with the device key and submitted with the entitlement, election ID, area, candidate ID, and timestamp. The entitlement is atomically consumed.
8. The ledger stores the signed ballot and an audit event, but must not publish a mapping from RRID/government voter ID to candidate choice.

## Key custody decision

The key should be generated on the user's device, ideally as a non-exportable WebAuthn/passkey credential or hardware-backed key. The current web app generates a non-extractable Web Crypto private key and stores it in browser IndexedDB; it does not download a PEM private key. Server-generated private keys would let the server impersonate voters and would make the election operator a holder of every voting credential.

The key must remain immutable. Do not add location, RRID, government voter ID, or the chosen candidate into the key, and never mutate the key after voting. Store those facts as separate, append-only, access-controlled records. In particular, do not update a key with the candidate: that would create a direct identity-to-choice link and break ballot secrecy.

## Privacy-preserving entitlement options

- **Minimum viable prototype:** keep the RRID-to-entitlement mapping in a protected server table, keep the public chain keyed by a random election credential, and restrict the mapping to election-authority operators.
- **Stronger production design:** have RIDTP issue a blind-signed or zero-knowledge eligibility token containing only election ID, constituency, expiry, and a one-time nullifier. The voting service verifies and consumes the token without learning the RRID during ballot casting.
- **Do not use:** a JWT or browser field containing `canVoteFor2026: true` without server-side signature, issuer, expiry, and revocation validation.
