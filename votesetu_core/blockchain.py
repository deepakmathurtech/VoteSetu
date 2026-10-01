"""
blockchain.py
--------------
The immutable ledger that stores every cast vote.

Design goals mapped to real requirements:
  * Transparency -> anyone can walk the chain and recount every vote
  * Security     -> each block is hash-linked to its parent; proof-of-work
                    makes rewriting history computationally expensive
  * Trust        -> ballots are only accepted into a block after their
                    digital signature has been verified (see election.py)
  * Auditability -> full chain validation detects any tampering instantly
"""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

from . import merkle

DEFAULT_DIFFICULTY = 4  # number of leading zero hex digits required in a block hash


@dataclass
class Block:
    index: int
    timestamp: float
    votes: List[Dict[str, Any]]
    previous_hash: str
    merkle_root: str = ""
    nonce: int = 0
    hash: str = ""

    def compute_hash(self) -> str:
        """Deterministic hash over the block's contents (excludes `hash` itself)."""
        block_body = {
            "index": self.index,
            "timestamp": self.timestamp,
            "votes": self.votes,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce,
        }
        block_string = json.dumps(block_body, sort_keys=True).encode("utf-8")
        return hashlib.sha256(block_string).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class Blockchain:
    """
    A proof-of-work blockchain specialised for storing signed ballots.

    Each block holds a batch ("polling round") of votes. Votes are only
    ever appended via `add_block`, and the chain is designed to be
    re-validated at any time with `is_chain_valid`.
    """

    def __init__(self, difficulty: int = DEFAULT_DIFFICULTY):
        self.difficulty = difficulty
        self.chain: List[Block] = []
        self.pending_votes: List[Dict[str, Any]] = []
        self._create_genesis_block()

    # ------------------------------------------------------------------ #
    # Chain construction
    # ------------------------------------------------------------------ #
    def _create_genesis_block(self) -> None:
        genesis = Block(
            index=0, timestamp=time.time(), votes=[], previous_hash="0",
            merkle_root=merkle.merkle_root([]),
        )
        genesis.hash = self._mine_block(genesis)
        self.chain.append(genesis)

    @property
    def last_block(self) -> Block:
        return self.chain[-1]

    def _mine_block(self, block: Block) -> str:
        """Simple proof-of-work: find a nonce such that the hash has
        `difficulty` leading zeros. This is what makes retroactively
        altering a block (and thus a vote) computationally expensive."""
        target_prefix = "0" * self.difficulty
        block.nonce = 0
        computed_hash = block.compute_hash()
        while not computed_hash.startswith(target_prefix):
            block.nonce += 1
            computed_hash = block.compute_hash()
        return computed_hash

    # ------------------------------------------------------------------ #
    # Adding votes
    # ------------------------------------------------------------------ #
    def add_vote(self, vote: Dict[str, Any]) -> None:
        """Queue an already-verified, signed vote to be included in the next block."""
        self.pending_votes.append(vote)

    def mine_pending_votes(self) -> Block:
        """Seal all currently pending votes into a new mined block."""
        if not self.pending_votes:
            raise ValueError("No pending votes to mine into a block.")

        new_block = Block(
            index=self.last_block.index + 1,
            timestamp=time.time(),
            votes=self.pending_votes,
            previous_hash=self.last_block.hash,
            merkle_root=merkle.merkle_root(self.pending_votes),
        )
        new_block.hash = self._mine_block(new_block)
        self.chain.append(new_block)
        self.pending_votes = []
        return new_block

    # ------------------------------------------------------------------ #
    # Validation / transparency
    # ------------------------------------------------------------------ #
    def is_chain_valid(self) -> (bool, str):
        """Walk the entire chain and confirm hash-linking and PoW integrity.

        Returns (is_valid, message).
        """
        target_prefix = "0" * self.difficulty

        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            if current.hash != current.compute_hash():
                return False, f"Block {current.index} has been tampered with (hash mismatch)."

            if current.merkle_root != merkle.merkle_root(current.votes):
                return False, f"Block {current.index}'s votes do not match its Merkle root (vote data tampered with)."

            if current.previous_hash != previous.hash:
                return False, f"Block {current.index} is not correctly linked to block {previous.index}."

            if not current.hash.startswith(target_prefix):
                return False, f"Block {current.index} does not satisfy proof-of-work difficulty."

        return True, "Blockchain is valid. No tampering detected."

    def all_votes(self) -> List[Dict[str, Any]]:
        """Flatten every vote stored across all mined blocks (for tallying / audit)."""
        votes = []
        for block in self.chain:
            votes.extend(block.votes)
        return votes

    def find_vote(self, ballot_id: str):
        """Locate an anonymous ballot across all mined blocks.
        Returns (block, index_within_block, vote) or (None, None, None).
        """
        for block in self.chain:
            for i, vote in enumerate(block.votes):
                if vote.get("ballot_id") == ballot_id:
                    return block, i, vote
        return None, None, None

    def to_dict(self) -> List[Dict[str, Any]]:
        return [block.to_dict() for block in self.chain]
