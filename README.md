# VoteSetu

VoteSetu is an educational voting prototype built with Flask. It demonstrates a browser-based voting workflow with RIDTP-compatible authentication, government-roll eligibility checks, signed ballots, and a blockchain-style public audit trail. The repository includes local demo data and a local roll importer; it does not include an official identity provider, electoral roll, candidate feed, or election-authority service.

## Why this project exists

VoteSetu demonstrates how a voting system can:

- keep the private key on the voter’s browser instead of sending it to the server
- require RIDTP-authenticated identity before registration or voting
- bind a voter credential to a verified government roll entry for the active election
- verify ballot signatures against the registered public key
- prevent duplicate votes and stale ballots with freshness checks
- produce a verifiable Merkle receipt for each accepted vote
- let anyone inspect the demo chain and check its integrity, while making clear that this does not eliminate trust in the operator

VoteSetu is not suitable for conducting a real election. Its security boundaries and remaining limitations are described below and in [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## Requirements

- Python 3.10 or newer
- A RIDTP-compatible authentication service reachable by the VoteSetu server. By default, the app expects it at `http://localhost:4000`; this service is not included in this repository.
- A modern browser with Web Crypto and IndexedDB support

You can run the app and browse its public pages without RIDTP, but sign-in, registration, and voting require the authentication service and an eligible linked demo roll record.

## Current security model

| Guarantee | How it is enforced in the current app |
|---|---|
| Verified identity | The app checks a RIDTP-authenticated profile before registration and voting. |
| Government-roll linkage | A voter must have an eligible record in the active election and matching RIDTP subject. |
| Client-side key custody | A browser-generated RSA keypair is used for the credential; the private key is never sent to the server. |
| Authenticity | Each ballot is signed client-side and verified against the voter’s registered public key. |
| One-person-one-vote | The registry tracks whether the voter has already voted and prevents re-use. |
| Replay resistance | Ballots are rejected if they are stale or outside the configured freshness window. |
| Integrity | Blocks are hash-linked and each mined round contains a Merkle root. |
| Verifiability | A voter can fetch a receipt and validate the proof in-browser. |
| Admin access control | Administrative actions require a shared bearer key printed at startup; there are no separate operator roles. |
| Abuse mitigation | Request throttling, content limits, and strict response headers are enabled. |

## Project structure

```text
votesetu/
├── app.py                     # Flask API + browser-based voting UI
├── demo.py                   # CLI scenario for vote issuance and validation
├── network_demo.py           # Multi-node blockchain demonstration
├── requirements.txt          # Python dependencies
├── test_votesetu.py          # Behavior and security regression tests
├── templates/                # HTML pages for dashboard, register, vote, verify, explorer, admin
├── static/
│   ├── css/
│   └── js/                  # Browser logic for key generation, signing, verification, UI actions
├── votesetu_core/
│   ├── blockchain.py         # Block and chain validation logic
│   ├── crypto_utils.py       # Signing and verification helpers
│   ├── election.py           # Vote rules, tallying, receipts, validation
│   ├── government_roll.py    # Government roll / eligibility logic
│   ├── merkle.py             # Merkle tree utilities
│   ├── node.py               # Simple multi-node consensus demonstration
│   └── registry.py           # Voter registry storage and checks
├── government_demo/          # Synthetic roll records and local importer
├── data/                     # Local SQLite databases and generated state
└── README.md
```

## Quick start

### Setup scripts

The setup scripts create a `venv`, install dependencies, and start the Flask app. They do not start or configure the separate RIDTP service.

| Platform | Command |
|---|---|
| Windows | Run `setup.bat` |
| macOS | Run `setup.command` or `./setup.sh` |
| Linux | Run `./setup.sh` |

### Manual setup

Create an environment and install the dependencies listed in `requirements.txt`:

```bash
python -m venv .venv
```

Run the following commands from the repository root. On Windows PowerShell:

```powershell
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python app.py
```

On macOS or Linux:

```bash
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app.py
```

Open <http://127.0.0.1:5000>. The server prints a generated admin key at startup. Keep the terminal open to retain the key and stop the server with `Ctrl+C`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `RIDTP_AUTH_URL` | `http://localhost:4000` | Base URL of the RIDTP-compatible authentication service. |
| `VOTESETU_ADMIN_KEY` | Random key generated at startup | Sets the admin bearer key instead of generating one. Treat it as a secret. |
| `VOTESETU_COOKIE_SECURE` | `true` | Marks the RIDTP session cookie Secure. Keep enabled behind HTTPS. For local HTTP-only testing, it can be set to `false`; never expose that configuration on a public network. |

Example for local HTTP testing only:

```powershell
$env:VOTESETU_COOKIE_SECURE = "false"
.venv\Scripts\python app.py
```

The app uses local SQLite databases under `data/`. The election state, demo voter registry, government roll, and roll decisions are local prototype state, not a shared or production database.

## Available pages

| Route | Purpose |
|---|---|
| `/` | Dashboard with turnout and election status |
| `/register` | Browser-side key generation and voter registration |
| `/vote` | Cast a signed ballot for the current election |
| `/verify` | Check a voter receipt and Merkle proof |
| `/explorer` | Inspect block hashes, links, and merkle roots |
| `/admin` | Election administration and round-closing actions |

## RIDTP and government-roll flow

The app expects the following RIDTP-compatible service behavior:

1. The service accepts login requests at `/api/auth/login` and session checks at `/api/auth/me`.
2. The returned profile identifies the RIDTP subject and has active status with a `VERIFIED` or `VERIFIED_HIGH` trust band.
3. The subject is linked to an eligible record for the active election in the local government-roll database.
4. The ballot location comes from that stored roll record and must match configured demo geography.

The included RIDTP directory and government records are synthetic examples. They are not an identity authority or proof of legal eligibility. See [government_demo/README.md](government_demo/README.md) for the importer workflow and [GOVERNMENT_DATA_CONTRACT.md](GOVERNMENT_DATA_CONTRACT.md) for the proposed authority data boundary.

## Admin access

When the server starts, it prints an admin key to the console. The same bearer key is required for election creation/reset, government-roll imports, and closing a round. It is a simple demo control, not election-official identity or multi-person authorization.

Example output:

```text
================================================================
  VoteSetu admin key (required for /election and /admin/close-round):
  <random-key>
================================================================
```

Use that key on the admin page or send it in the `X-Admin-Key` header for API calls. Anyone who obtains it can perform the protected admin actions. Do not expose it in screenshots, logs, or public issue reports.

## Current end-to-end flow

### Web flow

1. The user authenticates via RIDTP.
2. The browser generates a session-bound RSA credential.
3. The app validates the RIDTP subject against the current government record.
4. A voter is registered only if the RIDTP identity is eligible for the active election.
5. The voter signs a ballot locally and submits it to `/votes/cast`.
6. The app checks the voter’s RIDTP binding, credential session, area eligibility, and signature before accepting the ballot.
7. An admin closes the round with `/admin/close-round` to mine pending votes into a new block.
8. The voter retrieves a receipt and verifies its proof in-browser.
9. Anyone can inspect the chain and validate the ledger integrity.

### CLI and validation flow

```bash
python demo.py
python network_demo.py
pytest test_votesetu.py -v
```

## Test coverage

`test_votesetu.py` is a behavior and security regression suite for the demo,
not a production election certification. It covers valid voting, duplicate and
forged ballots, candidate and timestamp validation, concurrent double-vote
attempts, chain tampering, Merkle receipts, RIDTP-linked government-roll
eligibility, roll revision rollback protection, cross-site vote requests, and
required UI translation keys. Each test explains the behavior it checks and
the regression it is meant to prevent.

The election fixture uses a temporary SQLite database per test, so running the
suite does not remove or reuse the app's local election database. Run only the
government-roll cases with:

```bash
pytest test_votesetu.py -k government_roll -v
```

## Government roll demo

The project includes a sample authority workflow under `government_demo/`. These records are synthetic and intended only for local testing.

Import a file with:

```bash
python government_demo/import_roll.py government_demo/inbox/eligible_voter.json
```

The importer validates the record shape, election ID, revision, and linked RIDTP directory entry. Validly structured records can be stored with `eligible`, `ineligible`, or `needs_ridtp_link` decisions; malformed, wrong-election, stale, or conflicting same-revision records are rejected. Only eligible, linked records can register for the active election. See [government_demo/README.md](government_demo/README.md) for field definitions and revision rules.

## API overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Dashboard page |
| POST | `/auth/login` | Login with RIDTP credentials |
| GET | `/auth/me` | Check current RIDTP session |
| POST | `/auth/logout` | Clear the RIDTP session cookie |
| POST | `/election` | Admin: create or reset election state |
| POST | `/admin/government-roll/import` | Admin: import a government-roll JSON file |
| POST | `/voters/register` | Register a voter using a browser-generated public key |
| POST | `/voters/credential` | Create or rotate the current session-bound credential |
| POST | `/votes/cast` | Submit a signed ballot |
| POST | `/admin/close-round` | Admin: mine a new block |
| GET | `/votes/receipt/<voter_id>` | Get Merkle proof data for a voter |
| POST | `/votes/verify` | Validate a receipt |
| GET | `/results` | Fetch live vote totals |
| GET | `/chain` | Inspect the blockchain |
| GET | `/chain/validate` | Verify ledger integrity |
| GET | `/stats` | Summary metrics |

## Security notes and limitations

This is a prototype and educational reference implementation, not a production election system. Important limits include:

- RIDTP-compatible authentication and the local roll model do not establish legal identity or official voter eligibility.
- The candidate list, geography, and authority records are demo values, not official election data.
- Ballot privacy is pseudonymous and is not fully anonymous from the operator; remote voting also cannot prevent coercion.
- The consensus and proof-of-work model are educational and intentionally simplified.
- Admin control is a single bearer key; a valid key can perform destructive election actions.
- The default server is Flask's development server, with local SQLite and process-local rate limiting. It is not configured for production deployment, redundancy, or operational monitoring.
- Roll revision checks prevent stale or conflicting updates but do not authenticate or cryptographically verify the authority that supplied a record.

Review [SECURITY_AUDIT.md](SECURITY_AUDIT.md) and [SECURITY_AUDIT_REPORT_2026-09-19.md](SECURITY_AUDIT_REPORT_2026-09-19.md) before extending the security model. Do not use real voter data with this demo.

## License

This project is provided for educational and prototyping use.
