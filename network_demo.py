"""
network_demo.py
----------------
Demonstrates VoteSetu's multi-node trust model:

  1. Three independent nodes stand up separate copies of the ledger
     (imagine: Election Commission, an opposition-party observer, and
     an independent NGO auditor).
  2. Votes are cast and mined on Node A; the resulting block is
     broadcast to Node B and Node C, who verify and adopt it.
  3. A compromised/malicious node crafts a forged, longer-looking
     chain with an altered vote and tries to push it onto the network.
     The honest nodes independently verify it and REJECT it -- no
     single party, not even the one running the "main" server, can
     unilaterally rewrite the result.

Run with: python network_demo.py
"""

from votesetu_core.node import Node
from votesetu_core.blockchain import Block
from votesetu_core import merkle


def line(char="-", n=64):
    print(char * n)


def main():
    line("=")
    print("  VOTESETU -- Multi-Node Consensus Demonstration")
    line("=")

    # 1. Stand up three independent nodes and connect them ------------------
    commission = Node("Election Commission Node", difficulty=3)
    party_observer = Node("Opposition Party Observer Node", difficulty=3)
    ngo_auditor = Node("Independent NGO Auditor Node", difficulty=3)
    commission.connect(party_observer, ngo_auditor)
    party_observer.connect(ngo_auditor)

    print("\nThree independent nodes online:")
    for n in [commission, party_observer, ngo_auditor]:
        print(f"  - {n.name}")

    # 2. Votes arrive at the Commission node and get mined -------------------
    line()
    print("STEP 1: Commission node receives votes and mines a block")
    line()
    sample_votes = [
        {"voter_id": "v1", "candidate": "Aarav Sharma", "timestamp": 1000, "signature": "sig1"},
        {"voter_id": "v2", "candidate": "Priya Verma", "timestamp": 1001, "signature": "sig2"},
        {"voter_id": "v3", "candidate": "Priya Verma", "timestamp": 1002, "signature": "sig3"},
    ]
    for v in sample_votes:
        commission.chain.add_vote(v)

    block = commission.mine_and_broadcast()
    print(f"  Commission mined block #{block.index} (hash {block.hash[:16]}...) and broadcast it.")

    # 3. Confirm the other nodes independently synced -------------------------
    line()
    print("STEP 2: Verifying the other two nodes independently adopted it")
    line()
    for n in [party_observer, ngo_auditor]:
        synced = n.is_synced_with(commission)
        print(f"  {n.name}: synced={synced}, chain_length={len(n.chain.chain)}")

    # 4. A malicious actor tries to push a forged chain -----------------------
    line()
    print("STEP 3: A compromised node forges an altered vote and tries to broadcast it")
    line()
    malicious = Node("Compromised Node (attacker)", difficulty=3)
    malicious.connect(party_observer)  # attacker tries to reach an honest node

    # Attacker copies the real chain, quietly flips a candidate on block 1,
    # then mines one more block on top to make their chain LONGER (so it
    # can't simply be dismissed for being short) -- but without correctly
    # re-mining block 1 to match its now-different contents.
    import copy
    forged_chain = copy.deepcopy(commission.chain)
    forged_chain.chain[1].votes[0]["candidate"] = "Kabir Singh"  # tamper!
    forged_chain.add_vote({"voter_id": "v4", "candidate": "Kabir Singh", "timestamp": 1003, "signature": "sig4"})
    forged_chain.mine_pending_votes()  # attacker mines an extra block to outgrow the honest chain
    # NOTE: the attacker never went back and re-mined block 1's proof-of-work
    # for its new (tampered) contents -- redoing that for every already-
    # confirmed block is exactly the "51% attack" cost that makes rewriting
    # history on a real chain prohibitively expensive.

    print("  Attacker flips voter v1's recorded candidate to 'Kabir Singh'...")
    print("  Attacker mines an extra block to make their forged chain LONGER...")
    print("  Attacker broadcasts their (longer, tampered) chain to the party observer node.")

    accepted = party_observer.receive_block(forged_chain)
    print(f"\n  Result: forged chain accepted = {accepted}")
    if party_observer.rejected_log:
        print(f"  Reason logged by honest node: {party_observer.rejected_log[-1]}")

    # 5. Final state across all honest nodes -----------------------------------
    line()
    print("STEP 4: Final ledger state across all honest nodes (should all agree)")
    line()
    for n in [commission, party_observer, ngo_auditor]:
        s = n.summary()
        print(f"  {s['node']:<35} votes={s['total_votes']} valid={s['valid']} hash={s['latest_hash'][:16]}...")

    line("=")
    print("  Consensus demo complete: tampering was caught and rejected")
    print("  before it could ever reach an honest node's accepted ledger.")
    line("=")


if __name__ == "__main__":
    main()
