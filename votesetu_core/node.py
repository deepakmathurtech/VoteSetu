"""
node.py
-------
A minimal multi-node consensus layer, simulating how VoteSetu would run
across several independent parties (election commission, party
observers, independent auditors) instead of trusting a single server.

Consensus rule implemented: **longest valid chain wins** (a simplified,
educational version of Nakamoto consensus). A node only ever replaces
its own chain with a peer's chain if that chain is:
  1. strictly longer, AND
  2. fully valid (every block correctly hash-linked, proof-of-work
     satisfied, and every Merkle root matches its votes)

This means a malicious or compromised node cannot force others to
accept a tampered history -- the other nodes simply verify and reject it.

For a production system you'd want a permissioned BFT-style protocol
(e.g. PBFT, Raft, Tendermint) with known validator identities rather
than public proof-of-work, but the trust story -- "don't take any
single party's word for the ledger, verify it yourself" -- is the same.
"""

from __future__ import annotations

import copy
from typing import List, Dict, Any

from .blockchain import Blockchain, Block
from . import merkle


class Node:
    """One independent ledger-holding participant in the VoteSetu network."""

    def __init__(self, name: str, difficulty: int = 4):
        self.name = name
        self.chain = Blockchain(difficulty=difficulty)
        self.peers: List["Node"] = []
        self.rejected_log: List[str] = []

    def connect(self, *peers: "Node") -> None:
        for p in peers:
            if p not in self.peers:
                self.peers.append(p)
            if self not in p.peers:
                p.peers.append(self)

    # ------------------------------------------------------------------ #
    def mine_and_broadcast(self) -> Block:
        """Mine this node's own pending votes, then push the result to peers."""
        block = self.chain.mine_pending_votes()
        for peer in self.peers:
            peer.receive_block(self.chain)
        return block

    def receive_block(self, source_chain: Blockchain) -> bool:
        """A peer's chain has been received. Adopt it only if it is both
        longer AND fully valid (proof-of-work + hash-links + Merkle roots).
        Returns True if adopted, False if rejected.
        """
        candidate = source_chain.chain

        if len(candidate) <= len(self.chain.chain):
            self.rejected_log.append(
                f"Rejected chain: not longer than current chain "
                f"({len(candidate)} <= {len(self.chain.chain)})."
            )
            return False

        temp = Blockchain(difficulty=self.chain.difficulty)
        temp.chain = copy.deepcopy(candidate)
        valid, message = temp.is_chain_valid()

        if not valid:
            self.rejected_log.append(f"Rejected chain: {message}")
            return False

        self.chain = temp
        return True

    def is_synced_with(self, other: "Node") -> bool:
        return self.chain.chain[-1].hash == other.chain.chain[-1].hash

    def summary(self) -> Dict[str, Any]:
        return {
            "node": self.name,
            "chain_length": len(self.chain.chain),
            "latest_hash": self.chain.last_block.hash,
            "total_votes": len(self.chain.all_votes()),
            "valid": self.chain.is_chain_valid()[0],
        }
