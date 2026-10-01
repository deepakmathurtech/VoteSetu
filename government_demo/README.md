# Government Roll Import Demo

This folder demonstrates importing one normalized voter record and checking its link to the local RIDTP demo directory. All supplied names, IDs, locations, and accounts are synthetic. This tool is for local development only; it is not an authenticated government feed or production voter-data system.

## Requirements

- Python 3.10 or newer
- Project dependencies installed from the repository root with `python -m pip install -r requirements.txt`
- Run commands from the repository root so the sample paths resolve

## Demo flow

1. Put a normalized voter JSON file in `inbox/`. Include every required field
   shown below, including the authority's `roll_version` label and a positive
   integer `roll_sequence` for this voter's record.
2. Run:

   ```powershell
   python government_demo/import_roll.py government_demo/inbox/new_voter.json
   ```

3. The importer validates the record and checks its `ridtp_rid` against
   `ridtp_directory.json`. It checks the revision before replacing an existing
   decision for the same election and official voter ID.
4. The decision is written to `decisions/<input-name>.decision.json`. Records
   that pass structural, election, and revision checks are stored in the local
   SQLite database at `data/government_roll.db`, including ineligible and
   unlinked records.
5. The app permits registration only when the signed-in RIDTP subject has an
   eligible linked record for the active election. The app itself must also be
   running, and the RIDTP-compatible service must be available.

## Input format

```json
{
  "election_id": "gbnagar-local-2027",
  "official_voter_id": "DEMO-UP-0001",
  "full_name": "Example Voter",
  "state": "Uttar Pradesh",
  "district": "Gautam Buddha Nagar",
  "city": "Greater Noida",
  "area": "Alpha",
  "constituency": "Greater Noida Civic Ward 1",
  "ridtp_rid": "ridtp-demo-alice",
  "eligible": true,
  "roll_version": "2027-demo-1",
  "roll_sequence": 1,
  "source": "Demo Election Authority"
}
```

`ridtp_rid` is optional when the voter has not been linked yet; omit it or set it to `null` to receive `needs_ridtp_link`. `eligible` must be a JSON boolean. The `election_id` must match the active demo election (`gbnagar-local-2027`). `roll_sequence` must be a positive signed 64-bit integer; booleans, strings, fractional numbers, zero, negative values, and larger integers are invalid.

## What the decisions mean

- `eligible`: official record is valid, marked eligible, and linked to an active verified RIDTP account.
- `ineligible`: the authority record exists but says the person is not eligible, or the linked RIDTP account is inactive/unverified.
- `needs_ridtp_link`: the government record is valid but has no RIDTP link yet. The voter must not be allowed to vote until the authority completes that mapping.
- `rejected`: malformed, wrong-election, stale, conflicting same-revision, or otherwise invalid input.

`roll_sequence` is a positive signed 64-bit integer revision for one `(election_id,
official_voter_id)`. Repeating identical data with the same sequence is
idempotent. Any changed field must use a higher sequence; lower revisions and
conflicting same-sequence data are rejected. This prevents stale imports from
rolling back a newer decision, but does not authenticate the source of an
import.

The official voter ID is stored in the local roll database and decision file.
It is not copied into the public blockchain ballot or receipt by the current
prototype. Treat these files as sensitive: do not use real voter details,
publish them, or commit them to source control.

## Decision outcomes

- `eligible`: the authority record marks the voter eligible and the linked RIDTP demo account exists, is active, and has a verified trust band.
- `ineligible`: the authority record marks the voter ineligible, or its linked RIDTP account is unavailable, inactive, or unverified.
- `needs_ridtp_link`: the record is eligible but has no RIDTP identity link.
- `rejected`: required data is missing or invalid, the record is for another election, or its revision is stale or conflicts with an existing same-sequence record.

The CLI exits with status `0` for `eligible`, `ineligible`, or `needs_ridtp_link`, and status `1` for `rejected` or input/read errors. A non-eligible decision is a valid import outcome, not an import failure.

## Try the supplied files

```powershell
python government_demo/import_roll.py government_demo/inbox/eligible_voter.json
python government_demo/import_roll.py government_demo/inbox/missing_ridtp_link.json
python government_demo/import_roll.py government_demo/inbox/ineligible_voter.json
```

Re-importing a supplied file writes its decision file again but does not create a new roll revision or change the stored import timestamp. To model a correction, copy the record, change the relevant field, increment `roll_sequence`, and import the corrected file.

## Security and production boundary

This importer reads local JSON files and trusts their contents after shape,
election, RIDTP-link, and revision checks. It does not authenticate the source,
verify a digital signature, encrypt the SQLite database, or provide review and
approval workflows. A production integration needs an authenticated and
signed authority feed, access controls, encrypted storage, auditable approvals,
retention rules, and tests against the authority's actual data contract. See
the repository's [government data contract](../GOVERNMENT_DATA_CONTRACT.md).
