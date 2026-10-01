"""
election.py
-----------
Ties together the voter registry, cryptography, and blockchain into a
single election engine:

  1. A voter builds a ballot {voter_id, candidate, timestamp}
  2. The voter signs the ballot with their private key (this happens on
     the client side in a real system; `cast_vote` accepts the signature
     as input to simulate that boundary).
  3. VoteSetu verifies:
        - the voter is registered
        - the voter has not already voted
        - the signature is valid for that voter's registered public key
        - the candidate exists
  4. Only after all checks pass is the vote queued into the blockchain's
     pending pool. A poll administrator (or a timer, in production)
     periodically calls `close_round()` to mine those votes into an
     immutable block.
"""

from __future__ import annotations

import json
import base64
import secrets
import threading
import time
from typing import List, Dict, Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from . import crypto_utils
from . import merkle as merkle_mod
from .blockchain import Blockchain
from .registry import VoterRegistry

# A signed ballot is only accepted if its client-supplied timestamp is
# within this window of the server's clock. This bounds how long a
# captured-in-transit signed ballot could be replayed by an attacker
# (the has_voted check also blocks replay for a voter who already
# succeeded, but this closes the gap for requests that never completed,
# and limits exposure generally).
BALLOT_FRESHNESS_WINDOW_MS = 5 * 60 * 1000  # 5 minutes


class VoteRejected(Exception):
    """Raised when a ballot fails validation and cannot be accepted."""


class Election:
    def __init__(
        self,
        title: str,
        candidates: List[str],
        db_path: str = "votesetu.db",
        difficulty: int = 4,
    ):
        if len(set(candidates)) != len(candidates):
            raise ValueError("Candidate names must be unique.")
        self.title = title
        self.candidates = candidates
        self.registry = VoterRegistry(db_path=db_path)
        self.chain = Blockchain(difficulty=difficulty)
        self._cast_lock = threading.Lock()
        self._ballot_key = AESGCM.generate_key(bit_length=256)

    # ------------------------------------------------------------------ #
    # Voter-facing helpers
    # ------------------------------------------------------------------ #
    def register_voter(self, full_name: str) -> Dict[str, str]:
        """[DEMO ONLY] Server generates the keypair. See register_voter_with_key
        for the real, client-side-key registration path used by the web app."""
        return self.registry.register_voter(full_name)

    def register_voter_with_key(
        self,
        full_name: str,
        public_key_pem: str,
        ridtp_rid: str | None = None,
        credential_session: str | None = None,
        state: str | None = None,
        city: str | None = None,
        area: str | None = None,
    ) -> str:
        """Register a voter using a public key generated on THEIR device.
        The server never sees a private key. Returns voter_id."""
        return self.registry.register_voter_with_key(
            full_name,
            public_key_pem,
            ridtp_rid,
            credential_session,
            state=state,
            city=city,
            area=area,
        )

    def rotate_voter_key(self, voter_id: str, ridtp_rid: str, public_key_pem: str, credential_session: str) -> None:
        self.registry.rotate_public_key(voter_id, ridtp_rid, public_key_pem, credential_session)

    @staticmethod
    def build_ballot_message(voter_id: str, candidate: str, timestamp_ms: int) -> str:
        """Canonical string that gets signed.

        Deliberately a plain delimited string (not JSON): JSON number
        formatting can differ subtly between Python's json.dumps and
        JavaScript's JSON.stringify (float precision, trailing zeros),
        which would silently break signature verification for a
        browser-side signer. A fixed delimiter format with an INTEGER
        millisecond timestamp sidesteps that entirely and is trivial to
        reproduce byte-for-byte in any language.
        """
        return f"{voter_id}|{candidate}|{int(timestamp_ms)}"

    @staticmethod
    def sign_ballot(private_key_pem: str, voter_id: str, candidate: str) -> Dict[str, Any]:
        """Convenience for clients: builds + signs a ballot in one call.

        Invalid demo keys are tolerated here so callers can still assemble a ballot
        and let the server reject it based on voter existence or other policy checks.
        Real cryptographic signing still happens for valid key material.
        """
        timestamp_ms = int(time.time() * 1000)
        message = Election.build_ballot_message(voter_id, candidate, timestamp_ms)
        try:
            signature = crypto_utils.sign_message(private_key_pem, message)
        except ValueError:
            signature = "invalid-demo-signature"
        return {
            "voter_id": voter_id,
            "candidate": candidate,
            "timestamp": timestamp_ms,
            "signature": signature,
        }

    # ------------------------------------------------------------------ #
    # Casting a vote
    # ------------------------------------------------------------------ #
    def cast_vote(self, voter_id: str, candidate: str, timestamp: float, signature: str) -> None:
        """Validate a signed ballot and, if valid, queue it for the next block."""
        if candidate not in self.candidates:
            raise VoteRejected(f"'{candidate}' is not a valid candidate.")

        voter = self.registry.get_voter(voter_id)
        if voter is None:
            raise VoteRejected("Voter is not registered.")

        now_ms = int(time.time() * 1000)
        if abs(now_ms - int(timestamp)) > BALLOT_FRESHNESS_WINDOW_MS:
            raise VoteRejected(
                "Ballot timestamp is outside the acceptable window. "
                "Please try again (your device clock may be off, or this "
                "may be a replayed ballot)."
            )

        message = self.build_ballot_message(voter_id, candidate, timestamp)
        if not crypto_utils.verify_signature(voter["public_key"], message, signature):
            raise VoteRejected("Ballot signature is invalid. Vote rejected for security reasons.")

        ballot_id = secrets.token_urlsafe(32)
        nonce = secrets.token_bytes(12)
        encrypted_candidate = AESGCM(self._ballot_key).encrypt(
            nonce,
            candidate.encode("utf-8"),
            ballot_id.encode("utf-8"),
        )

        # Everything above is safe to re-check concurrently; the actual
        # accept-or-reject decision for double voting must be atomic, or
        # two simultaneous requests for the same voter could both pass a
        # separate "already voted?" check before either flips it. Holding
        # a process-local lock around the atomic DB update closes that
        # race for this single-process demo server (see registry.py's
        # docstring for the DB-level half of this guarantee, which also
        # protects against races across multiple worker processes).
        with self._cast_lock:
            claimed = self.registry.mark_voted_if_not_already(voter_id, ballot_id)
            if not claimed:
                raise VoteRejected("Voter has already cast a vote. Double voting is not permitted.")

            vote_record = {
                "ballot_id": ballot_id,
                "nonce": base64.b64encode(nonce).decode("ascii"),
                "encrypted_candidate": base64.b64encode(encrypted_candidate).decode("ascii"),
                "timestamp": timestamp,
            }
            self.chain.add_vote(vote_record)

    def close_round(self):
        """Mine all pending, verified votes into a new immutable block."""
        return self.chain.mine_pending_votes()

    # ------------------------------------------------------------------ #
    # Transparency / results
    # ------------------------------------------------------------------ #
    def tally(self) -> Dict[str, int]:
        results = {c: 0 for c in self.candidates}
        for vote in self.chain.all_votes():
            candidate = self._decrypt_candidate(vote)
            results[candidate] += 1
        return results

    def _decrypt_candidate(self, vote: Dict[str, Any]) -> str:
        try:
            nonce = base64.b64decode(vote["nonce"])
            encrypted_candidate = base64.b64decode(vote["encrypted_candidate"])
            return AESGCM(self._ballot_key).decrypt(
                nonce,
                encrypted_candidate,
                vote["ballot_id"].encode("utf-8"),
            ).decode("utf-8")
        except (KeyError, ValueError, TypeError) as error:
            raise VoteRejected("Encrypted ballot data is invalid.") from error

    def verify_integrity(self):
        return self.chain.is_chain_valid()

    def audit_trail(self) -> List[Dict[str, Any]]:
        """Return every block with its votes, for public inspection."""
        return self.chain.to_dict()

    def get_receipt(self, voter_id: str) -> Dict[str, Any]:
        """Return a voter's cryptographic receipt: their vote record plus
        a Merkle proof against the block's published root. A voter (or
        anyone with the receipt) can verify inclusion with `verify_receipt`
        WITHOUT downloading any other voter's data.
        """
        voter = self.registry.get_voter(voter_id)
        ballot_id = voter.get("ballot_id") if voter else None
        block, idx, vote = self.chain.find_vote(ballot_id) if ballot_id else (None, None, None)
        if block is None:
            raise VoteRejected("No mined vote found for this voter_id (not yet mined, or never voted).")

        proof = merkle_mod.build_proof(block.votes, idx)
        return {
            "vote": vote,
            "block_index": block.index,
            "block_hash": block.hash,
            "merkle_root": block.merkle_root,
            "merkle_proof": proof,
        }

    @staticmethod
    def verify_receipt(receipt: Dict[str, Any]) -> bool:
        """Independently verify a receipt's Merkle proof reconstructs the
        block's merkle_root. This is exactly what a voter's own device
        (or an independent observer) would run."""
        return merkle_mod.verify_proof(
            receipt["vote"], receipt["merkle_proof"], receipt["merkle_root"]
        )

    def stats(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "candidates": self.candidates,
            "registered_voters": self.registry.voter_count(),
            "votes_cast": self.registry.turnout_count(),
            "blocks_mined": len(self.chain.chain),
            "pending_votes": len(self.chain.pending_votes),
        }
