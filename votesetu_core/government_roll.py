"""Demo government-roll importer and eligibility lookup.

The importer models the authority-side handoff. It is intentionally separate
from the public blockchain: official voter IDs and personal details stay in
this protected local database and are never placed in ballot records.
"""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

REQUIRED_FIELDS = {
    "election_id",
    "official_voter_id",
    "full_name",
    "state",
    "district",
    "city",
    "area",
    "constituency",
    "eligible",
    "roll_version",
    "roll_sequence",
    "source",
}


class GovernmentRoll:
    def __init__(self, db_path: str = "data/government_roll.db", ridtp_directory: str = "government_demo/ridtp_directory.json"):
        self.db_path = db_path
        self.ridtp_directory = Path(ridtp_directory)
        self._init_db()

    def _connect(self):
        conn = sqlite3.connect(self.db_path, timeout=5.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA busy_timeout = 5000")
        return conn

    def _init_db(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS government_roll (
                    election_id TEXT NOT NULL,
                    official_voter_id TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    state TEXT NOT NULL,
                    district TEXT NOT NULL,
                    city TEXT NOT NULL,
                    area TEXT NOT NULL,
                    constituency TEXT NOT NULL,
                    ridtp_rid TEXT,
                    eligible INTEGER NOT NULL,
                    decision TEXT NOT NULL,
                    roll_version TEXT NOT NULL,
                    roll_sequence INTEGER NOT NULL DEFAULT 0,
                    source TEXT NOT NULL,
                    imported_at REAL NOT NULL,
                    PRIMARY KEY (election_id, official_voter_id)
                )
                """
            )
            columns = {row["name"] for row in conn.execute("PRAGMA table_info(government_roll)")}
            if "roll_sequence" not in columns:
                conn.execute(
                    "ALTER TABLE government_roll ADD COLUMN roll_sequence INTEGER NOT NULL DEFAULT 0"
                )

    def _ridtp_account(self, ridtp_rid: str | None) -> dict[str, Any] | None:
        if not ridtp_rid or not self.ridtp_directory.exists():
            return None
        directory = json.loads(self.ridtp_directory.read_text(encoding="utf-8"))
        return directory.get(ridtp_rid)

    def import_file(self, path: str, expected_election_id: str = "gbnagar-local-2027") -> dict[str, Any]:
        source_path = Path(path)
        record = json.loads(source_path.read_text(encoding="utf-8"))
        missing = sorted(REQUIRED_FIELDS - record.keys())
        if missing:
            return self._decision(record, "rejected", f"Missing required fields: {', '.join(missing)}")
        if record["election_id"] != expected_election_id:
            return self._decision(record, "rejected", "Record belongs to a different election")
        if not isinstance(record["eligible"], bool):
            return self._decision(record, "rejected", "eligible must be true or false")
        if (
            isinstance(record["roll_sequence"], bool)
            or not isinstance(record["roll_sequence"], int)
            or not 1 <= record["roll_sequence"] <= 2**63 - 1
        ):
            return self._decision(record, "rejected", "roll_sequence must be a positive 64-bit integer")

        account = self._ridtp_account(record.get("ridtp_rid"))
        if not record["eligible"]:
            decision = "ineligible"
            reason = "Government roll marks this voter as ineligible"
        elif not record.get("ridtp_rid"):
            decision = "needs_ridtp_link"
            reason = "Eligible government record has no RIDTP identity link"
        elif not account:
            decision = "ineligible"
            reason = "Linked RIDTP account does not exist"
        elif account.get("status") != "active" or account.get("trustBand") not in {"VERIFIED", "VERIFIED_HIGH"}:
            decision = "ineligible"
            reason = "Linked RIDTP account is not active and verified"
        else:
            decision = "eligible"
            reason = "Government eligibility and RIDTP account check passed"

        return self._store(record, decision, reason)

    def _store(self, record: dict[str, Any], decision: str, reason: str) -> dict[str, Any]:
        fields = (
            "full_name", "state", "district", "city", "area", "constituency",
            "ridtp_rid", "eligible", "roll_version", "roll_sequence", "source",
        )
        values = {
            "full_name": record["full_name"],
            "state": record["state"],
            "district": record["district"],
            "city": record["city"],
            "area": record["area"],
            "constituency": record["constituency"],
            "ridtp_rid": record.get("ridtp_rid"),
            "eligible": int(record["eligible"]),
            "roll_version": record["roll_version"],
            "roll_sequence": record["roll_sequence"],
            "source": record["source"],
        }
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            existing = conn.execute(
                "SELECT * FROM government_roll WHERE election_id = ? AND official_voter_id = ?",
                (record["election_id"], record["official_voter_id"]),
            ).fetchone()
            if existing:
                current_sequence = existing["roll_sequence"]
                incoming_sequence = record["roll_sequence"]
                if incoming_sequence < current_sequence:
                    return self._decision(record, "rejected", "Stale roll sequence; a newer record is already imported")
                if incoming_sequence == current_sequence:
                    if all(existing[field] == values[field] for field in fields):
                        return self._decision(record, existing["decision"], "This roll record version was already imported")
                    return self._decision(record, "rejected", "Record changes require a higher roll_sequence")

            conn.execute(
                """
                INSERT INTO government_roll (
                    election_id, official_voter_id, full_name, state, district,
                    city, area, constituency, ridtp_rid, eligible, decision,
                    roll_version, roll_sequence, source, imported_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(election_id, official_voter_id) DO UPDATE SET
                    full_name=excluded.full_name, state=excluded.state,
                    district=excluded.district, city=excluded.city,
                    area=excluded.area, constituency=excluded.constituency,
                    ridtp_rid=excluded.ridtp_rid, eligible=excluded.eligible,
                    decision=excluded.decision, roll_version=excluded.roll_version,
                    roll_sequence=excluded.roll_sequence, source=excluded.source,
                    imported_at=excluded.imported_at
                """,
                (
                    record["election_id"], record["official_voter_id"], values["full_name"],
                    values["state"], values["district"], values["city"], values["area"],
                    values["constituency"], values["ridtp_rid"], values["eligible"],
                    decision, values["roll_version"], values["roll_sequence"], values["source"], time.time(),
                ),
            )
        return self._decision(record, decision, reason)

    @staticmethod
    def _decision(record: dict[str, Any], decision: str, reason: str) -> dict[str, Any]:
        return {
            "official_voter_id": record.get("official_voter_id"),
            "election_id": record.get("election_id"),
            "decision": decision,
            "reason": reason,
            "ridtp_rid": record.get("ridtp_rid"),
            "roll_version": record.get("roll_version"),
            "roll_sequence": record.get("roll_sequence"),
        }

    def eligible_record(self, election_id: str, ridtp_rid: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM government_roll WHERE election_id = ? AND ridtp_rid = ? AND decision = 'eligible'",
                (election_id, ridtp_rid),
            ).fetchone()
        return dict(row) if row else None
