"""
demo.py
-------
End-to-end demonstration of VoteSetu:

    1. Create an election with candidates
    2. Register voters (each gets an RSA keypair -> a "digital ballot ID")
    3. Voters sign and cast their ballots
    4. Poll admin mines the votes into the blockchain
    5. Anyone can verify chain integrity and see the transparent tally
    6. A tamper attempt is simulated to show the system catches it

Run with:  python demo.py
"""

import os
import json

from votesetu_core.election import Election, VoteRejected

DB_PATH = "data/votesetu_demo.db"


def line(char="-", n=64):
    print(char * n)


def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    line("=")
    print("  VOTESETU -- Blockchain-Based Secure Voting Platform")
    line("=")

    election = Election(
        title="Village Council President 2026",
        candidates=["Aarav Sharma", "Priya Verma", "Kabir Singh"],
        db_path=DB_PATH,
        difficulty=4,
    )
    print(f"\nElection created: '{election.title}'")
    print(f"Candidates: {', '.join(election.candidates)}\n")

    # 1. Register voters --------------------------------------------------
    line()
    print("STEP 1: Registering voters (each receives a private signing key)")
    line()
    voter_names = ["Anjali Gupta", "Rohan Mehta", "Sara Khan", "Vikram Rao", "Neha Joshi"]
    credentials = {}
    for name in voter_names:
        creds = election.register_voter(name)
        credentials[name] = creds
        print(f"  Registered '{name}' -> voter_id={creds['voter_id']}")

    # 2. Cast votes ---------------------------------------------------------
    line()
    print("STEP 2: Voters sign and cast their ballots")
    line()
    # Note: "Vikram Rao" is intentionally left unvoted here so STEP 4 can
    # demonstrate a *forged signature* attempt against them without that
    # attempt being masked by the (separate) double-vote check.
    choices = {
        "Anjali Gupta": "Priya Verma",
        "Rohan Mehta": "Aarav Sharma",
        "Sara Khan": "Priya Verma",
        "Neha Joshi": "Priya Verma",
    }
    for name, candidate in choices.items():
        creds = credentials[name]
        ballot = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], candidate)
        election.cast_vote(**ballot)
        print(f"  '{name}' voted (signature verified, vote accepted).")

    # 3. Attempt double vote -------------------------------------------------
    line()
    print("STEP 3: Attempting a double-vote (should be rejected)")
    line()
    try:
        creds = credentials["Anjali Gupta"]
        ballot = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "Kabir Singh")
        election.cast_vote(**ballot)
    except VoteRejected as e:
        print(f"  Rejected as expected: {e}")

    # 4. Attempt forged signature --------------------------------------------
    line()
    print("STEP 4: Attempting a forged/tampered ballot (should be rejected)")
    line()
    try:
        creds = credentials["Vikram Rao"]
        # Someone else's private key signs "as" Vikram -> signature won't match Vikram's public key
        forger_creds = election.register_voter("Unregistered Forger (temp)")
        ballot = Election.sign_ballot(forger_creds["private_key_pem"], creds["voter_id"], "Aarav Sharma")
        election.cast_vote(**ballot)
    except VoteRejected as e:
        print(f"  Rejected as expected: {e}")

    # 5. Mine the block -------------------------------------------------------
    line()
    print("STEP 5: Poll admin closes the round -> votes mined into a block")
    line()
    block = election.close_round()
    print(f"  Block #{block.index} mined. Hash: {block.hash}")
    print(f"  Votes sealed in this block: {len(block.votes)}")

    # 6. Verify chain integrity -------------------------------------------------
    line()
    print("STEP 6: Verifying blockchain integrity (transparency check)")
    line()
    valid, message = election.verify_integrity()
    print(f"  {message}")

    # 7. Tally results ------------------------------------------------------
    line()
    print("STEP 7: Live, publicly auditable tally")
    line()
    results = election.tally()
    for candidate, count in sorted(results.items(), key=lambda x: -x[1]):
        print(f"  {candidate:<15} {count} vote(s)")

    winner = max(results, key=results.get)
    print(f"\n  Leading candidate: {winner}")

    # 8. Simulate tampering with the ledger ------------------------------------
    line()
    print("STEP 8: Simulating an attacker tampering with a stored vote")
    line()
    print("  Attacker changes block 1's first vote to a different candidate...")
    election.chain.chain[1].votes[0]["candidate"] = "Kabir Singh"
    valid, message = election.verify_integrity()
    print(f"  Integrity check result -> valid={valid}")
    print(f"  {message}")

    line()
    print("STEP 9: Election statistics")
    line()
    print(json.dumps(election.stats(), indent=2))

    line("=")
    print("  Demo complete.")
    line("=")


if __name__ == "__main__":
    main()
