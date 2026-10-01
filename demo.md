# VoteSetu End-to-End Demo Guide

This guide walks through one local demo election from government-roll import to
voter registration, ballot casting, admin block closing, and receipt checking.

> **Demo only:** VoteSetu is an educational prototype, not a real election
> service. The included voters, locations, and candidate names are synthetic.
> Do not use real voter information or use this system to conduct an election.

## Roles at a glance

| Role | What they do | Where they work |
|---|---|---|
| Government-roll operator | Import an eligible voter record linked to a RIDTP identity | Project terminal; `government_demo/import_roll.py` |
| Voter | Sign in, create a browser credential, vote, and verify a receipt | `/register`, `/vote`, and `/verify` in the browser |
| Election admin | Close the round so pending votes are added to a block | `/admin` in the browser, using the key printed by the server |
| Observer | Inspect the public demo ledger and its integrity | `/explorer` or the dashboard at `/` |

There is no separate government web page. The included government workflow is a
local command-line importer. A protected admin API also exists, but the CLI is
the simplest way to load the supplied demo record.

## Before you start

You need Python 3.10 or newer, a modern browser, and a RIDTP-compatible Auth
service running separately. By default, VoteSetu calls that service at
`http://localhost:4000`; the RIDTP service is not included in this repository.

The RIDTP service must provide a test account whose profile is active, has a
`VERIFIED` or `VERIFIED_HIGH` trust band, and has the same subject ID as the
eligible government record. The supplied eligible record uses this ID:

```text
did:rid:person:f94957d734ee1e56
```

The repository does not include a password for that account. Get test login
credentials from the operator of your RIDTP service. If your RIDTP test account
has a different subject ID, use a local test roll record linked to that exact
ID and ensure the local RIDTP directory contains an active, verified entry for
it. A mismatch prevents registration and voting even if both systems show a
verified user.

## 1. Import the demo government record

Open PowerShell in the repository root. Import the supplied eligible record:

```powershell
python government_demo/import_roll.py government_demo/inbox/eligible_voter.json
```

The expected decision is `eligible`. The importer writes the decision to
`government_demo/decisions/eligible_voter.decision.json` and stores the record
in `data/government_roll.db`. The imported record is for election
`gbnagar-local-2027` and area `Alpha`.

Other supplied records demonstrate non-eligible outcomes:

```powershell
python government_demo/import_roll.py government_demo/inbox/missing_ridtp_link.json
python government_demo/import_roll.py government_demo/inbox/ineligible_voter.json
```

Those records should not be used for the voter walkthrough. Read
[government_demo/README.md](government_demo/README.md) before preparing a
different JSON record; changed records for the same voter need a higher
`roll_sequence`.

## 2. Start VoteSetu

Keep the RIDTP service running in its own terminal. In a second PowerShell
terminal, from the VoteSetu repository root, run:

```powershell
if (-not (Test-Path .\venv\Scripts\python.exe)) {
    py -3 -m venv venv
}
.\venv\Scripts\python.exe -m pip install -r requirements.txt
$env:RIDTP_AUTH_URL = "http://localhost:4000"
$env:VOTESETU_COOKIE_SECURE = "false"
.\venv\Scripts\python.exe app.py
```

For this local HTTP-only demo, `VOTESETU_COOKIE_SECURE=false` allows the RIDTP
session cookie to work at `127.0.0.1`. Do not use that setting on a public
network; a deployed service must use HTTPS. If your RIDTP service uses another
address, set `RIDTP_AUTH_URL` to that address before starting VoteSetu.

The server opens on `http://127.0.0.1:5000` and prints an **admin key** in this
terminal. Keep the terminal open and keep the key private. The key is generated
again when the server restarts unless `VOTESETU_ADMIN_KEY` was configured.

> `setup.bat` installs dependencies and starts the app, but does not set the
> local-only cookie setting above. Use the PowerShell commands here when
> testing RIDTP login over local HTTP.

## 3. Voter: sign in and register

1. Open [http://127.0.0.1:5000/register](http://127.0.0.1:5000/register).
2. In **Username, email or phone**, enter the identifier for the RIDTP test
   account. In **RIDTP password**, enter that account's password. These are
   credentials from RIDTP, not the VoteSetu admin key.
3. Click **Sign in with RIDTP**. The page should show a verified identity. If
   login fails, confirm the RIDTP service is reachable and that the account is
   active and verified.
4. The name field is filled from the authenticated profile and is read-only.
   Click **Generate key & register**. The browser creates the signing key and
   sends only its public key to VoteSetu.
5. Copy the displayed **Voter ID**. You will enter it on the Vote page and the
   Verify Receipt page.

Keep using the same browser tab and do not clear this site's browser data. The
private key is stored locally in that browser and is not recoverable by the
server. The credential is also bound to the active RIDTP session.

If registration says there is no eligible government-roll record, compare the
signed-in RIDTP subject with the `ridtp_rid` in the imported record. They must
match exactly, and the import decision must be `eligible`.

## 4. Voter: cast a ballot

1. Open [http://127.0.0.1:5000/vote](http://127.0.0.1:5000/vote) in the same
   browser tab.
2. Under **Where are you voting?**, select **Uttar Pradesh**, **Greater Noida**,
   and **Alpha**. The area must match the imported government record. Other
   available demo areas are not eligible for this sample voter.
3. Enter or confirm the **Voter ID** copied from Register. It is normally
   filled automatically in the same browser.
4. Choose one of the displayed demo candidates and click **Sign & cast my
   vote**. The browser signs the ballot locally; the server checks the
   signature and eligibility and queues the vote for the next block.

The default demo candidates are `Community Candidate A`, `Community Candidate
B`, and `Community Candidate C`. The sample record is assigned to area `Alpha`.
Each voter credential can cast only one accepted vote.

## 5. Admin: close the round

Votes remain pending until an admin mines a block.

1. Open [http://127.0.0.1:5000/admin](http://127.0.0.1:5000/admin).
2. Copy the admin key from the VoteSetu server terminal and paste it into the
   **Key** field. Click **Save key on this device**.
3. Check the live snapshot. After a successful vote, **Pending (unmined)**
   should be greater than zero.
4. Click **Close polling round & mine block**. The page reports the block
   number, number of votes, and block hash.

The admin key authorizes sensitive actions. Do not share it. The separate
**Create / reset election** form replaces the current election and its local
ledger; do not use it during a demo run unless you intend to discard that
run's state. The default election already has candidates, so no reset is
needed for these steps.

## 6. Voter: verify the receipt

After the admin closes the round:

1. In the same browser session, open
   [http://127.0.0.1:5000/verify](http://127.0.0.1:5000/verify).
2. Enter the same **Voter ID** and click **Fetch my receipt**.
3. Look for **Merkle proof verified**. The receipt shows its block number,
   block hash, Merkle root, and proof length. The candidate choice is hidden in
   the receipt UI.

If the page says no receipt was found, first confirm the admin has closed the
round and that the voter is still signed in with the same RIDTP identity. Only
the matching verified identity can retrieve that voter's receipt.

## 7. Inspect the ledger

- Open [http://127.0.0.1:5000/explorer](http://127.0.0.1:5000/explorer) to
  inspect blocks and hashes.
- Return to [http://127.0.0.1:5000/](http://127.0.0.1:5000/) for the dashboard
  and election totals.
- The admin page's **Ledger integrity** value and the chain validation endpoint
  report whether the local chain passes its integrity check.

## Government operator: use a different test voter

There is no government login page in this prototype. A local operator prepares
a JSON record under `government_demo/inbox/` and imports it from the repository
root with:

```powershell
python government_demo/import_roll.py government_demo/inbox/your_record.json
```

The record needs all fields shown in
[government_demo/README.md](government_demo/README.md), including `election_id`,
`official_voter_id`, the demo location, `eligible`, `roll_version`, and a
positive `roll_sequence`. For the current app, the election ID must be
`gbnagar-local-2027`. To allow sign-in, `ridtp_rid` must match the RIDTP
profile's subject and the corresponding local directory entry must be active
with a verified trust band. The CLI prints the decision and writes a decision
JSON file. `needs_ridtp_link`, `ineligible`, and `rejected` records cannot
register to vote.

## Common problems

| What you see | Check this |
|---|---|
| `RIDTP Auth is unavailable` | Start the separate RIDTP service and confirm `RIDTP_AUTH_URL` points to it. |
| Browser login succeeds but registration is denied | The profile must be active and verified, and its subject must exactly match an eligible record for this election. |
| Vote button stays disabled | Choose state, city, and area; enter a voter ID; choose a candidate. Use the area from the roll record. |
| Credential is missing | Return to the same browser tab and session where it was registered. Clearing site data can permanently remove the local private key. |
| Vote accepted but no receipt appears | The admin must close the round first. Then fetch the receipt while signed in as the same RIDTP identity. |
| Admin key rejected | Use the key printed by the currently running VoteSetu process; restarting the process may generate a new one. |

This walkthrough demonstrates software behavior only. The local RIDTP directory
and government-roll records are synthetic and do not prove legal identity or
eligibility. Review [SECURITY_AUDIT.md](SECURITY_AUDIT.md) before extending the
prototype; it documents important privacy, coercion, authority, and operations
limitations.