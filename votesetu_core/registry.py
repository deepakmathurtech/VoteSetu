"""
registry.py
-----------
Voter registry backed by SQLite.

Responsibilities:
  * Register a voter -> generates an RSA keypair, stores the PUBLIC key
    only (private key is returned once to the voter and never persisted
    server-side -- exactly like a real digital ballot credential).
  * Enforce one-person-one-vote by tracking `has_voted`.
  * Look up a voter's public key so a cast vote's signature can be verified.

Note on realism: in a genuine large-scale deployment the private key
would be generated client-side (e.g. in the voter's browser/app) and
never transmitted to the server at all. Here, for a self-contained demo,
`register_voter` generates the pair and hands the private key back to
the caller once so it can simulate that "handed to the voter" moment.
"""

from __future__ import annotations

import sqlite3
import time
from contextlib import contextmanager
from typing import Optional, Dict, Any

from . import crypto_utils

DEFAULT_DB_PATH = "votesetu.db"


class VoterRegistry:
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        self._init_db()

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path, timeout=5.0)
        conn.execute("PRAGMA busy_timeout = 5000")
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS voters (
                    voter_id       TEXT PRIMARY KEY,
                    full_name      TEXT NOT NULL,
                    public_key     TEXT NOT NULL,
                    ridtp_rid      TEXT,
                    credential_session TEXT,
                    state          TEXT,
                    city           TEXT,
                    area           TEXT,
                    ballot_id      TEXT,
                    registered_at  REAL NOT NULL,
                    has_voted      INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            columns = {row[1] for row in conn.execute("PRAGMA table_info(voters)")}
            if "ridtp_rid" not in columns:
                conn.execute("ALTER TABLE voters ADD COLUMN ridtp_rid TEXT")
            if "credential_session" not in columns:
                conn.execute("ALTER TABLE voters ADD COLUMN credential_session TEXT")
            if "state" not in columns:
                conn.execute("ALTER TABLE voters ADD COLUMN state TEXT")
            if "city" not in columns:
                conn.execute("ALTER TABLE voters ADD COLUMN city TEXT")
            if "area" not in columns:
                conn.execute("ALTER TABLE voters ADD COLUMN area TEXT")
            if "ballot_id" not in columns:
                conn.execute("ALTER TABLE voters ADD COLUMN ballot_id TEXT")
            conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_ridtp_rid ON voters(ridtp_rid)")

    # ------------------------------------------------------------------ #
    def register_voter(self, full_name: str) -> Dict[str, str]:
        """[CONVENIENCE / DEMO ONLY] Generate a keypair server-side and
        register it in one step. Returns the private key to the caller.

        This exists so the CLI demo and test suite can run without a
        browser. For any real deployment, use `register_voter_with_key`
        instead, with the public key generated on the voter's own device
        (see the web frontend, which uses the browser's Web Crypto API).
        """
        private_pem, public_pem = crypto_utils.generate_keypair()
        voter_id = self.register_voter_with_key(full_name, public_pem)
        return {
            "voter_id": voter_id,
            "private_key_pem": private_pem,
            "public_key_pem": public_pem,
        }

    def register_voter_with_key(
        self,
        full_name: str,
        public_key_pem: str,
        ridtp_rid: Optional[str] = None,
        credential_session: Optional[str] = None,
        state: Optional[str] = None,
        city: Optional[str] = None,
        area: Optional[str] = None,
    ) -> str:
        """Register a voter using a PUBLIC key generated on the voter's
        own device. The server never sees, generates, or stores a
        private key. Returns the derived voter_id.
        """
        full_name = (full_name or "").strip()
        if not (1 <= len(full_name) <= 120):
            raise ValueError("full_name must be between 1 and 120 characters.")

        # Validate it's actually a usable, sufficiently strong public key
        # before storing it (rejects malformed keys and weak/undersized
        # RSA keys that would be cheap to attack).
        try:
            public_key = crypto_utils.load_public_key(public_key_pem)
        except Exception as e:
            raise ValueError(f"Invalid public key: {e}")

        key_size = getattr(public_key, "key_size", None)
        if key_size is not None and key_size < crypto_utils.MIN_RSA_KEY_SIZE:
            raise ValueError(
                f"Public key is too weak ({key_size}-bit); minimum is "
                f"{crypto_utils.MIN_RSA_KEY_SIZE}-bit RSA."
            )

        voter_id = crypto_utils.fingerprint_public_key(public_key_pem)

        with self._connect() as conn:
            if ridtp_rid and conn.execute(
                "SELECT 1 FROM voters WHERE ridtp_rid = ?", (ridtp_rid,)
            ).fetchone():
                raise ValueError("This RIDTP identity is already registered.")
            existing = conn.execute(
                "SELECT 1 FROM voters WHERE voter_id = ?", (voter_id,)
            ).fetchone()
            if existing:
                raise ValueError("This identity is already registered.")

            conn.execute(
                "INSERT INTO voters (voter_id, full_name, public_key, ridtp_rid, credential_session, state, city, area, registered_at, has_voted) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
                (
                    voter_id,
                    full_name,
                    public_key_pem,
                    ridtp_rid,
                    credential_session,
                    state,
                    city,
                    area,
                    time.time(),
                ),
            )

        return voter_id

    def get_voter_by_ridtp(self, ridtp_rid: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM voters WHERE ridtp_rid = ?", (ridtp_rid,)
            ).fetchone()
            return dict(row) if row else None

    def rotate_public_key(self, voter_id: str, ridtp_rid: str, public_key_pem: str, credential_session: str) -> None:
        try:
            public_key = crypto_utils.load_public_key(public_key_pem)
        except Exception as error:
            raise ValueError(f"Invalid public key: {error}")
        key_size = getattr(public_key, "key_size", None)
        if key_size is not None and key_size < crypto_utils.MIN_RSA_KEY_SIZE:
            raise ValueError(
                f"Public key is too weak ({key_size}-bit); minimum is "
                f"{crypto_utils.MIN_RSA_KEY_SIZE}-bit RSA."
            )

        with self._connect() as conn:
            cursor = conn.execute(
                "UPDATE voters SET public_key = ?, credential_session = ?, registered_at = ? "
                "WHERE voter_id = ? AND ridtp_rid = ? AND has_voted = 0",
                (public_key_pem, credential_session, time.time(), voter_id, ridtp_rid),
            )
            if cursor.rowcount != 1:
                raise ValueError("This voter has already voted or is not owned by the signed-in RIDTP identity.")

    def get_voter(self, voter_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM voters WHERE voter_id = ?", (voter_id,)
            ).fetchone()
            return dict(row) if row else None

    def has_voted(self, voter_id: str) -> bool:
        voter = self.get_voter(voter_id)
        if voter is None:
            raise ValueError("Voter not found.")
        return bool(voter["has_voted"])

    def mark_voted_if_not_already(self, voter_id: str, ballot_id: str) -> bool:
        """Atomically flip has_voted 0 -> 1 in a single UPDATE statement.

        This closes a real race condition: two near-simultaneous requests
        for the same voter could otherwise both pass a separate
        "has_voted?" check before either one called a separate "mark
        voted" step, letting both through. Folding the check and the
        write into one UPDATE ... WHERE has_voted = 0 makes the
        read-then-write atomic at the database level.

        Returns True if this call was the one that flipped it (i.e. the
        vote should proceed), False if the voter had already voted.
        """
        with self._connect() as conn:
            cursor = conn.execute(
                "UPDATE voters SET has_voted = 1, ballot_id = ? WHERE voter_id = ? AND has_voted = 0",
                (ballot_id, voter_id),
            )
            return cursor.rowcount == 1

    def voter_count(self) -> int:
        with self._connect() as conn:
            return conn.execute("SELECT COUNT(*) AS c FROM voters").fetchone()["c"]

    def turnout_count(self) -> int:
        with self._connect() as conn:
            return conn.execute(
                "SELECT COUNT(*) AS c FROM voters WHERE has_voted = 1"
            ).fetchone()["c"]
