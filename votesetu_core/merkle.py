"""
merkle.py
---------
Merkle tree over the votes in a single block.

Why this matters at "large scale": without it, verifying that your vote
is really in the ledger means downloading and re-hashing every vote in
every block -- fine for 50 votes, unworkable for 50 million. A Merkle
tree lets VoteSetu publish just one 32-byte root per block, and hand
each voter a tiny proof (O(log n) hashes) that lets THEM verify their
own vote is included, without trusting the server and without
downloading anyone else's ballot data.

This is the same technique real blockchains (Bitcoin, Ethereum) use for
light clients.
"""

from __future__ import annotations

import hashlib
import json
from typing import List, Dict, Any, Optional


def _hash_pair(left: str, right: str) -> str:
    return hashlib.sha256((left + right).encode("utf-8")).hexdigest()


def leaf_hash(vote: Dict[str, Any]) -> str:
    """Deterministic hash of a single vote record."""
    canonical = json.dumps(vote, sort_keys=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def merkle_root(votes: List[Dict[str, Any]]) -> str:
    """Compute the Merkle root over a list of votes. Empty list -> hash of ''."""
    if not votes:
        return hashlib.sha256(b"").hexdigest()

    level = [leaf_hash(v) for v in votes]
    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])  # duplicate last node on odd levels
        level = [_hash_pair(level[i], level[i + 1]) for i in range(0, len(level), 2)]
    return level[0]


def build_proof(votes: List[Dict[str, Any]], index: int) -> List[Dict[str, str]]:
    """Build a Merkle proof (sibling path) for the vote at `index`.

    Returns a list of {"position": "left"|"right", "hash": "..."} steps.
    Combined with the leaf hash, replaying these steps up the tree must
    reproduce the block's merkle_root.
    """
    if index < 0 or index >= len(votes):
        raise IndexError("Vote index out of range.")

    level = [leaf_hash(v) for v in votes]
    proof: List[Dict[str, str]] = []
    idx = index

    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])

        is_right = idx % 2 == 1
        sibling_idx = idx - 1 if is_right else idx + 1
        proof.append({
            "position": "left" if is_right else "right",
            "hash": level[sibling_idx],
        })

        level = [_hash_pair(level[i], level[i + 1]) for i in range(0, len(level), 2)]
        idx //= 2

    return proof


def verify_proof(vote: Dict[str, Any], proof: List[Dict[str, str]], expected_root: str) -> bool:
    """Verify a vote + its Merkle proof reconstructs the expected root.

    This is exactly what a voter's own device would run, using ONLY:
      - their own vote record
      - the small proof handed to them at cast time
      - the block's published merkle_root (public, tiny, easy to
        cross-check against multiple independent nodes)
    """
    current = leaf_hash(vote)
    for step in proof:
        if step["position"] == "left":
            current = _hash_pair(step["hash"], current)
        else:
            current = _hash_pair(current, step["hash"])
    return current == expected_root
