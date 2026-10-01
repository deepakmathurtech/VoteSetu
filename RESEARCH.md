# VoteSetu: Research on Verifiable, Identity-Linked Digital Voting

**Research type:** Technical architecture and security research note  
**Project:** VoteSetu  
**Version context:** Repository state observed on 2026-10-01  
**Status:** Prototype research; not an election certification or deployment approval

---

## Abstract

VoteSetu is an educational voting prototype that explores how a browser-based voting workflow could combine RIDTP-authenticated identity, government-roll eligibility, client-held signing keys, encrypted ballots, and a publicly inspectable integrity log. Its central design question is:

> Can a voting service provide meaningful voter eligibility checks and independently verifiable record integrity without publishing a direct voter-to-choice mapping?

The prototype demonstrates several useful building blocks. A voter can authenticate through a RIDTP-compatible service, register a browser-generated public key, sign a ballot locally, submit it for server-side validation, and receive a Merkle inclusion receipt after the ballot is mined. The ledger is hash-linked, and a multi-node demonstration shows independent nodes rejecting a tampered longer chain.

The research conclusion is deliberately bounded. Hashes, signatures, Merkle trees, and consensus can improve authenticity and integrity, but they do not by themselves establish legal voter eligibility, ballot secrecy from the operator, resistance to coercion, accessibility, service availability, or democratic legitimacy. The most important production transition is therefore not stronger proof-of-work. It is separation of the eligibility decision from ballot casting, supported by signed authority data, independent key custody, auditable governance, and a protocol that does not turn a receipt into evidence of how a person voted.

---

## 1. Research Scope and Questions

### 1.1 Scope

This document studies the current VoteSetu repository as a prototype system. It covers:

- the identity and eligibility boundary between RIDTP and VoteSetu;
- browser-side credential generation and ballot signing;
- server-side ballot validation and one-vote enforcement;
- encrypted ballot storage and result tallying;
- blockchain-style integrity and Merkle receipts;
- the multi-node trust demonstration;
- operational, privacy, governance, and accessibility concerns;
- a path from educational prototype to a reviewable production architecture.

It does not certify the correctness of an election, validate a real government integration, or claim that remote internet voting is safe for a legally binding election.

### 1.2 Research questions

1. **Eligibility:** Can the service prevent an authenticated but ineligible account from voting for an active election?
2. **Authenticity:** Can the service distinguish a ballot signed by the registered browser credential from a forged or replayed request?
3. **Integrity:** Can voters and observers detect changes to accepted ballot records after inclusion in the ledger?
4. **Privacy:** Does the public evidence avoid exposing plaintext choices or an obvious voter-to-choice mapping?
5. **Independence:** Can more than one operator independently inspect and reject a tampered ledger?
6. **Governance:** What trust remains in the election operator, authority data provider, and decryption process?
7. **Readiness:** What must change before the prototype could be evaluated as a serious election service rather than a teaching system?

### 1.3 Working thesis

VoteSetu can provide a useful **verifiability and security teaching model** today, but its trust model is still operator-centered. The production research direction should move from “a server with a blockchain-like audit trail” toward “separately governed eligibility, ballot casting, tallying, and public audit services.”

---

## 2. System Context

### 2.1 Actors

| Actor | Responsibility | Trust assumption in the prototype |
|---|---|---|
| Voter | Authenticates, registers a credential, signs a ballot, checks a receipt | Controls the browser session and private key while the browser remains trustworthy |
| RIDTP service | Supplies the authenticated identity and trust status | The service is available and its assertion is authentic |
| Government election authority | Supplies eligibility, geography, and candidate data | Not actually integrated; demo records are synthetic |
| VoteSetu application | Validates requests, stores registry state, queues ballots, exposes APIs | The running operator controls the process, database, and admin key |
| Election administrator | Opens, configures, closes, and audits an election | A single bearer key is authorized for protected actions |
| Observer node | Maintains an independent ledger copy and validates received chains | The observer runs honest verification code |
| Auditor or public observer | Reviews chain integrity, counts, configuration, and audit records | Public data is sufficient for the claimed check |
| Attacker | Attempts forgery, replay, tampering, abuse, or coercion | Cryptographic keys and protected services are not already fully compromised |

### 2.2 Current end-to-end flow

1. The voter signs in through a RIDTP-compatible authentication service.
2. VoteSetu checks that the profile is active and has an accepted trust band.
3. The server checks the RIDTP subject against the active election's government-roll record.
4. The browser creates an RSA key pair and sends only the public key for registration.
5. The browser signs a canonical ballot message containing voter credential, candidate, and timestamp.
6. VoteSetu checks candidate validity, timestamp freshness, signature validity, session binding, geography, and one-vote state.
7. The accepted candidate is encrypted with AES-GCM before it is added to the pending ledger.
8. An administrator or scheduled process closes the round and mines a block containing pending votes.
9. The voter retrieves a receipt containing the encrypted vote and Merkle proof.
10. The voter or observer verifies that the receipt is included in the published Merkle root.

The flow provides several independently checkable transitions, but it does not eliminate the application operator's ability to observe registry metadata, control the decryption key, or influence administrative configuration.

---

## 3. Architectural Model

### 3.1 Separation of concerns

VoteSetu has four important logical boundaries:

```text
RIDTP identity
      |
      | authenticated subject and trust status
      v
Eligibility service / government-roll adapter
      |
      | election-scoped entitlement
      v
Ballot casting service <---- browser-held signing credential
      |
      | encrypted ballot and audit event
      v
Ledger / receipt service
      |
      | independent validation and public evidence
      v
Observers and voters
```

The prototype currently implements these boundaries inside one Flask application and local databases. The diagram is therefore a logical model, not a claim that the deployment is already independently governed.

### 3.2 Data classes

| Data | Current handling | Desired production handling |
|---|---|---|
| RIDTP subject | Stored in the voter registry binding | Keep behind an access-controlled identity boundary |
| Government voter ID | Present in local demo roll records | Never publish; minimize retention and encrypt at rest |
| Public signing key | Stored against a voter credential | Bind to a short-lived election entitlement or hardware-backed credential |
| Private signing key | Generated in the browser and intended to remain there | Prefer WebAuthn/passkey or hardware-backed non-exportable key |
| Candidate choice | AES-GCM encrypted in the ledger | Use independently controlled election encryption and delayed threshold decryption |
| Ballot identifier | Random token stored in the registry and ledger | Keep unlinkable from identity at ballot-casting time where policy permits |
| Timestamp | Included in the signed ballot and encrypted vote record | Minimize precision in public evidence to reduce linkability |
| Receipt | Encrypted vote plus Merkle proof | Prove inclusion without proving the voter's choice or enabling coercion |
| Admin actions | Protected by one bearer key | Use named roles, dual approval, signed events, and immutable audit storage |

### 3.3 Cryptographic mechanisms

#### Browser credential

The web path generates a client-side RSA key pair. The private key is not uploaded to the server, and the current browser workflow uses non-extractable Web Crypto storage. This reduces the risk that the application server can directly impersonate every voter.

The design does not protect a device whose browser, operating system, extensions, or same-origin JavaScript has already been compromised. Credential recovery after device loss is also an unresolved policy problem.

#### Ballot signature

The signed message is a deterministic delimited string:

```text
voter_id|candidate|timestamp_ms
```

Using a fixed representation avoids cross-language JSON serialization differences between browser JavaScript and Python. A valid signature proves possession of the registered private key and integrity of the signed fields. It does not prove that the voter was legally eligible, that the candidate list was official, or that the voter was free from coercion.

#### Ballot encryption

The current election engine generates an AES-GCM key in the running process. Each accepted ballot gets a random ballot identifier and nonce, and the ballot identifier is used as authenticated associated data. This protects the candidate plaintext from ordinary public ledger inspection and detects ciphertext tampering.

The key custody model remains operator-controlled. Anyone who obtains the process key can decrypt the choices, and a process compromise can expose the whole election. Production use requires a dedicated key-management boundary, threshold control, audited decryption, and a legally defined release procedure.

#### Merkle receipts

A mined block contains a Merkle root over its votes. A receipt includes the vote record, block information, root, and proof path. An observer can verify that the exact encrypted record was included in that block without downloading every other vote.

This is an inclusion proof, not a secrecy proof. If the receipt or another public artifact lets a voter demonstrate their candidate choice, it can become useful for vote buying or coercion. The receipt protocol must be evaluated for its social consequences, not only its hash correctness.

#### Hash-linked ledger

Each block commits to the previous block and its contents. A post-mining modification invalidates chain validation. This gives strong tamper evidence for the data that the operator chose to place in the chain; it does not prove that omitted, rejected, or never-submitted ballots were handled fairly.

### 3.4 Consensus demonstration

`network_demo.py` models three nodes: an election commission, a party observer, and an independent NGO auditor. The nodes use a longest-valid-chain rule and independently check hash links, proof-of-work, and Merkle roots. A malicious node changes an earlier vote and mines an additional block without re-mining the altered history; honest nodes reject the chain.

This is a useful educational demonstration of independent verification. It is not a production consensus protocol. The repository itself notes that a permissioned Byzantine fault-tolerant or otherwise authority-aware protocol would be more appropriate than public proof-of-work for known election validators.

---

## 4. Security Properties and Evidence

### 4.1 Properties currently demonstrated

| Property | Evidence in the prototype | Confidence boundary |
|---|---|---|
| Authenticated access | RIDTP session and trust-band checks | Depends on the external identity service and session security |
| Eligibility linkage | Government-roll record must match the RIDTP subject and active election | Demo records are synthetic and unsigned |
| Client key custody | Browser submits public key and signatures, not private key material | Browser/device compromise remains in scope |
| Ballot authenticity | Registered public-key signature verification | Registry binding and server implementation remain trusted |
| Freshness | Ballot timestamp must be within a five-minute window | Clock skew and operational retry behavior need policy |
| One vote per registry row | Atomic mark-if-not-already-voted operation | Requires correct durable deployment across workers and failover |
| Candidate validation | Candidate must be in the configured allowlist | Candidate feed is not official in the prototype |
| Geography validation | Server checks configured state, city, and area | Demo geography is not legal delimitation |
| Chain integrity | Hash links, proof-of-work, and Merkle roots are checked | Integrity does not establish completeness or fairness |
| Receipt verification | Merkle proof can be checked independently | A receipt can create coercion risk if it becomes choice evidence |
| Cross-site request resistance | Mutation routes require same-origin checks | Requires correct deployment headers and browser behavior |

### 4.2 Properties not established

The prototype does not establish:

- that a person is legally entitled to vote;
- that one eligible person has only one real-world entitlement across all channels;
- that the operator cannot link a voter to a plaintext choice;
- that a voter is not being monitored, threatened, or paid;
- that the candidate list or polling geography is authoritative;
- that all eligible voters can access the service;
- that the service remains available during a high-load election deadline;
- that an administrator cannot reset or alter the election through privileged control;
- that a lost device can be recovered without enabling duplicate voting;
- that the public ledger contains every valid ballot and no invalid ballot;
- that the system satisfies a jurisdiction's election law or evidentiary rules.

---

## 5. Threat Model

### 5.1 Adversaries considered

1. **Unauthenticated requester:** Attempts to register or vote without a valid session.
2. **Credential thief:** Attempts to use another voter's identifier or a different private key.
3. **Replay attacker:** Re-submits a valid signed request or delays it until later.
4. **Database or ledger tamperer:** Changes stored ballot data or chain history.
5. **Compromised application node:** Sends a forged longer chain to honest observers.
6. **Malicious administrator:** Resets the election, changes configuration, or controls decryption.
7. **Bad data supplier:** Sends false, stale, unsigned, or manipulated roll/candidate data.
8. **Coercer:** Demands proof of a voter's choice or observes the voting device.
9. **Availability attacker:** Exhausts service capacity or targets the close-of-polls path.
10. **Insider or colluding operators:** Combine identity, registry, timestamps, keys, and ballot data.

### 5.2 Current mitigations

The regression suite and audit describe defenses against forged signatures, duplicate voting, stale ballots, invalid candidates, invalid locations, unauthorized identity changes, government-roll revocation, cross-site requests, chain tampering, and malformed keys.

These controls are most effective against request-level attacks. They do not resolve attacks where the trusted identity service, application operator, browser runtime, authority feed, administrator, or physical voting environment is malicious or compromised.

### 5.3 Security invariants

A production review should express the system as invariants that can be tested and audited:

- A ballot is accepted only for an active election and a valid, server-verified entitlement.
- A ballot signature verifies against the credential bound to that entitlement.
- An entitlement can be consumed at most once.
- A ballot cannot be altered without invalidating its commitment and audit trail.
- Public evidence cannot reveal a voter's plaintext choice or a stable identity-to-choice mapping.
- Administrative changes are attributable, authorized, reviewable, and append-only.
- Tally decryption cannot occur before the authorized close-of-polls event.
- A corrected authority record cannot silently roll back a later approved revision.
- Every failure path gives the voter an auditable status without exposing their choice.

---

## 6. Findings

### Finding F1: Eligibility is the highest-value production boundary

**Status:** Partially implemented for the demo.  
**Risk:** Critical if deployed with synthetic or self-asserted identity data.

A cryptographically valid ballot from a fake but verified local account is still an invalid election ballot. The current government-roll adapter validates record shape, election ID, RIDTP linkage, and monotonic revisions, but it does not authenticate the authority that supplied the JSON. Revision ordering prevents rollback; it does not prove source authenticity or truth.

**Research implication:** The next major integration should use signed authority-supplied election metadata and voter entitlements. VoteSetu should not infer legal eligibility from a generic account's trust band.

### Finding F2: Ballot privacy is improved but operator anonymity is absent

**Status:** Partially implemented.  
**Risk:** Critical for a remote election.

The public chain no longer needs to expose a plaintext candidate or direct voter ID. However, the application registry stores the ballot identifier associated with the voter, and the running process holds the decryption key. The operator can therefore link registry information to encrypted ballot records and decrypt choices.

**Research implication:** Split eligibility from casting. A dedicated authority or RIDTP service should issue a single-use, election-scoped entitlement that does not expose the root identity during ballot casting. Decryption should require independent custodians and occur only after the legally defined close of polls.

### Finding F3: The admin bearer key creates concentrated authority

**Status:** Prototype limitation.  
**Risk:** Critical.

A single bearer key protects election creation/reset, roll imports, and round closure. Whoever obtains that key can execute privileged actions. There is no separate role model, dual control, hardware-backed authorization, or immutable external audit of administrative intent.

**Research implication:** Replace the shared key with named authority identities, least-privilege roles, dual approval for destructive operations, signed configuration versions, append-only admin events, and independent monitoring.

### Finding F4: The consensus demo proves validation, not democratic independence

**Status:** Educational demonstration.  
**Risk:** High if its behavior is interpreted as production consensus.

Longest-valid-chain proof-of-work is simple to understand but does not model known election validators, legal authority, validator admission, network partitions, finality, or dispute resolution. Independent copies of the same software can still share the same faulty assumptions.

**Research implication:** Compare permissioned protocols and ordinary replicated databases with explicit governance. The central requirement is independently verifiable finality and accountable validator behavior, not mining as an end in itself.

### Finding F5: Coercion is outside the cryptographic boundary

**Status:** Unsolved.  
**Risk:** Critical.

A remote voter may be watched, forced to reveal credentials, required to show a receipt, or pressured to vote for a particular candidate. A receipt that proves inclusion can become coercive evidence if its surrounding workflow also reveals the choice.

**Research implication:** Do not treat voter verifiability as a simple “more proof is better” problem. Study receipt privacy, revoting policy, supervised alternatives, assisted voting, and the legal environment together.

### Finding F6: Recovery and accessibility are election requirements

**Status:** Unsolved.  
**Risk:** High.

A cleared browser, lost device, inaccessible interface, network interruption, or assistive-technology incompatibility can prevent an eligible person from voting. Recovery that simply creates a new key could also create a duplicate-vote path or enable impersonation.

**Research implication:** Design identity-verified recovery, revocation, assisted voting, offline or in-person alternatives, multilingual content, keyboard and screen-reader support, and voter-facing failure resolution before considering production readiness.

---

## 7. Authority Data Contract Research

### 7.1 Voter-roll input

The proposed contract correctly treats the election authority as the source of election ID, official voter ID, geography, eligibility, and revision. The service should preserve those identifiers rather than inventing local substitutes that could drift from the authority's records.

Recommended requirements:

- signed payloads with an authenticated issuer and key version;
- signed election ID, constituency, publication time, effective time, and expiration;
- monotonic sequence numbers plus explicit correction and supersession semantics;
- schema validation before any record becomes active;
- staged import, review, activation, and rollback procedures;
- anomaly reports for unexpected counts, geography changes, and mass eligibility changes;
- encrypted storage and strict access logging for personal data;
- an appeal path for voters whose records are missing or incorrectly revoked.

### 7.2 Candidate feed

Candidate data should be a separate signed feed rather than a hard-coded application allowlist. The feed needs candidate ID, official name, party or independent status, symbol, constituency, publication version, status, and source references. The ballot should submit an authority candidate ID, not a display name that can change through localization or formatting.

### 7.3 Data lifecycle

A realistic lifecycle is:

```text
Receive signed feed
      -> validate schema and signature
      -> quarantine and compare with active version
      -> human review of material changes
      -> activate at scheduled election version
      -> record append-only audit event
      -> expire or retain according to law
```

Import version numbers are necessary but insufficient. The source signature, key rotation policy, operator approval, and correction process must also be defined.

---

## 8. Production-Oriented Reference Architecture

### 8.1 Recommended service boundaries

1. **Identity gateway:** Validates RIDTP sessions and issuer signatures.
2. **Eligibility authority adapter:** Converts signed authority data into election-scoped entitlements.
3. **Credential service:** Registers and revokes device credentials without receiving private keys.
4. **Ballot casting service:** Accepts one valid entitlement and one signed encrypted ballot.
5. **Ledger service:** Commits ballots and signed audit events to replicated durable storage.
6. **Tally service:** Uses threshold-controlled decryption after polls close.
7. **Public audit service:** Publishes configuration, commitments, aggregate results, and non-sensitive proofs.
8. **Independent observers:** Operate separate validation software and retain their own evidence.

The boundaries should be backed by separate credentials, databases, logs, and operational owners where the election law and threat model require independence.

### 8.2 Eligibility entitlement

A preferred sequence is:

1. The voter authenticates to RIDTP.
2. The eligibility service verifies a signed authority record and current election version.
3. RIDTP or the eligibility service issues a short-lived, single-use entitlement containing election ID, constituency, expiration, and a nullifier.
4. The ballot service verifies the entitlement without receiving the root identity, or receives only a protected reference that is inaccessible to tally operators.
5. The entitlement is consumed atomically when a ballot is accepted.
6. The public ledger uses a random election credential rather than a government ID or RIDTP subject.

Blind signatures or zero-knowledge proofs may provide a stronger privacy boundary, but they add implementation and operational complexity. They should be evaluated with formal protocol review rather than adopted as decorative cryptography.

### 8.3 Tally and key custody

The tally key should not be held by the web process. A production design should consider:

- hardware security modules or equivalent key protection;
- multiple independent custodians;
- threshold decryption requiring a defined quorum;
- key ceremonies with recorded participants and test vectors;
- no decryption before close-of-polls authorization;
- public commitments to the election encryption key and tally procedure;
- reproducible tally software and independently rerunnable results.

### 8.4 Operations

Production operations need:

- a production WSGI or ASGI service rather than Flask's development server;
- durable shared rate limiting and queue storage;
- encrypted backups with tested restoration;
- redundant identity, eligibility, casting, and audit services;
- a published election clock and close-of-polls policy;
- monitoring for latency, rejection rates, duplicate attempts, and feed anomalies;
- incident response that preserves evidence without exposing ballot choices;
- a tamper-evident external audit log for administrative actions.

---

## 9. Evaluation Methodology

A serious evaluation should combine functional testing, security testing, privacy analysis, and operational exercises.

### 9.1 Functional and invariant tests

- valid registration, ballot signing, casting, mining, tallying, and receipt verification;
- duplicate submission under concurrent requests;
- credential rotation before and after voting;
- stale, malformed, cross-election, and wrong-constituency ballots;
- authority feed replay, rollback, conflicting revision, and correction;
- candidate feed version changes and disabled candidates;
- close-of-polls and delayed submission behavior;
- backup restoration and observer resynchronization.

### 9.2 Security testing

- web session, CSRF, origin, cookie, header, and rate-limit testing;
- key extraction and browser storage review;
- SQL injection, request size, parser, and denial-of-service testing;
- admin credential compromise and privilege-separation testing;
- ledger tampering, fork, replay, and network-partition simulation;
- supply-chain and dependency review;
- code review of cryptographic API usage and error handling.

### 9.3 Privacy testing

- attempt to link public receipts to registry rows;
- quantify timing, ordering, timestamp, and batch-size leakage;
- test whether a voter can prove a chosen candidate to a third party;
- test operator, database, observer, and colluding-custodian views separately;
- perform data-minimization and retention review for authority records;
- document what remains visible under endpoint logs, backups, and metrics.

### 9.4 Human factors and accessibility

- keyboard-only and screen-reader workflows;
- language and literacy review;
- low-bandwidth and interrupted-network sessions;
- shared-device and private-device scenarios;
- device loss and account recovery exercises;
- assisted-voting procedures;
- usability testing with voters who have different disabilities and levels of technical familiarity.

### 9.5 Evidence standard

Every security claim should identify:

1. the property being claimed;
2. the component enforcing it;
3. the adversary excluded by the claim;
4. the adversary still in scope;
5. the test or independent evidence supporting it;
6. the operational condition required for the claim to remain true.

This prevents a passing unit test from being presented as proof of a broader election guarantee.

---

## 10. Research Roadmap

### Phase 0: Preserve the teaching prototype

- Keep synthetic authority data clearly separated from production claims.
- Keep the existing regression tests and add tests for every documented invariant.
- Label the proof-of-work network demo as educational consensus behavior.
- Keep security audit dates and tested repository versions explicit.

### Phase 1: Make authority data authentic

- Define signed voter-roll and candidate-feed envelopes.
- Add issuer, key ID, signature, election version, effective time, and correction metadata.
- Add staged import and approval workflows.
- Add append-only import audit events and anomaly reports.
- Define personal-data retention and access policies.

### Phase 2: Reduce operator trust

- Replace the shared admin key with named roles and dual control.
- Move ballot encryption keys into threshold-controlled custody.
- Separate eligibility, casting, tally, and public audit ownership.
- Introduce a durable external audit log.
- Define observer membership, software versions, and dispute procedures.

### Phase 3: Improve ballot privacy and recovery

- Prototype election-scoped anonymous entitlements.
- Evaluate blind signatures or zero-knowledge eligibility proofs.
- Redesign receipts so inclusion cannot prove candidate choice.
- Specify device loss, revocation, recovery, and assisted-voting rules.
- Measure metadata leakage and retention exposure.

### Phase 4: Operational and human evaluation

- Deploy behind a production-grade service stack in a non-election environment.
- Run load, failure, backup, incident, and observer-reconciliation exercises.
- Complete independent cryptographic and application security reviews.
- Run accessibility and multilingual usability studies.
- Publish a threat model, security objectives, audit evidence, and known residual risks.

### Phase 5: Legal and election-authority review

- Map every data flow to applicable election and privacy law.
- Confirm whether remote voting is legally permitted for the target election.
- Define ballot secrecy, coercion, recount, contest, retention, and destruction procedures.
- Obtain authority approval for feeds, key ceremonies, observers, and close-of-polls rules.

---

## 11. Open Research Questions

1. What level of ballot privacy is legally required, and who must be unable to link identity to choice?
2. Can an anonymous entitlement be revoked or corrected without revealing the voter during casting?
3. How should a voter recover from a lost device without enabling multiple entitlements?
4. What receipt design gives useful inclusion evidence without enabling coercion?
5. Which validators are independent enough to provide meaningful oversight, and how are they admitted?
6. How should disputes distinguish a bad ballot, a bad authority record, a bad tally, and a bad user experience?
7. What is the minimum metadata needed for auditability without creating a timing or identity side channel?
8. How can voters verify the final tally without requiring them to trust the application operator's decryption code?
9. What happens when RIDTP is unavailable near the election deadline?
10. Which accessibility and assisted-voting options preserve both dignity and ballot secrecy?
11. What evidence is sufficient for an election authority to approve a software or dependency update during an election period?
12. When is a conventional replicated database with public commitments preferable to a blockchain-style ledger?

---

## 12. Conclusion

VoteSetu is a coherent educational prototype for demonstrating signed ballots, eligibility-linked registration, encrypted ballot records, Merkle receipts, and independently checked ledger integrity. Its strongest contribution is conceptual: it makes several trust boundaries visible and testable instead of treating a voting application as a single opaque database.

The same visibility also makes the limits clear. The prototype does not yet provide authoritative eligibility, operator-independent ballot secrecy, coercion resistance, resilient operations, inclusive access, or accountable election governance. Those are not gaps that can be closed by adding another hash or increasing mining difficulty.

The recommended research direction is to preserve the prototype's testable integrity mechanisms while redesigning the production trust model around signed authority feeds, one-time election entitlements, separated custody of identity and ballot data, threshold-controlled tallying, named administrative roles, independent observers, and privacy-aware receipts. Only after those boundaries are specified, implemented, and independently evaluated should VoteSetu be considered for any use beyond education and controlled experimentation.

---

## Appendix A: Repository Evidence Map

| Research topic | Repository evidence |
|---|---|
| Application workflow and limitations | `README.md` |
| Government-roll contract and future authority integration | `GOVERNMENT_DATA_CONTRACT.md` |
| Threat findings and attack simulation | `SECURITY_AUDIT.md` |
| Ballot validation, encryption, tally, and receipts | `votesetu_core/election.py` |
| Multi-node chain demonstration | `network_demo.py`, `votesetu_core/node.py` |
| Behavior and security regression coverage | `test_votesetu.py` |
| Browser registration and signing behavior | `static/js/register.js`, `static/js/vote.js` |
| Government-roll import examples | `government_demo/README.md`, `government_demo/import_roll.py` |

## Appendix B: Terminology

- **RIDTP:** The identity and authentication protocol boundary expected by the prototype.
- **RRID:** RIDTP Root Identity, referenced in the proposed government-data workflow.
- **Entitlement:** A short-lived, election-scoped authorization to cast one ballot.
- **Nullifier:** A value that allows one-time use detection without publishing the underlying identity.
- **Merkle proof:** A set of hashes proving that a record belongs to a committed Merkle root.
- **Threshold decryption:** A scheme where several independent key holders must cooperate to decrypt ballots or a tally.
- **Ballot secrecy:** Protection against learning how a specific voter voted.
- **End-to-end verifiability:** The ability for voters and observers to check important election properties without trusting one opaque component.
- **Coercion resistance:** Protection against a voter being forced to reveal or demonstrate their choice.
- **Authority feed:** A signed, versioned data publication from the legally responsible election authority.
