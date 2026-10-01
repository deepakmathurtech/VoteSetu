"""Behavior and security regression tests for VoteSetu's voting prototype.

The suite exercises the core election rules, signed-ballot checks, ledger and
receipt integrity, RIDTP-linked government-roll decisions, and selected web UI
contracts. Each test documents the behavior it protects and the failure it is
intended to catch. These tests support prototype development; they are not a
certification or production-election security assessment.

Run the complete suite with ``pytest test_votesetu.py -v``. Run a focused area
with ``pytest test_votesetu.py -k government_roll -v``.
"""

import json
from pathlib import Path

import pytest

from votesetu_core.election import Election, VoteRejected
from votesetu_core.government_roll import GovernmentRoll


@pytest.fixture()
def election(tmp_path):
    """Give each test an isolated SQLite election database."""
    return Election(
        title="Test Election",
        candidates=["A", "B"],
        db_path=str(tmp_path / "test_votesetu.db"),
        difficulty=2,
    )


def test_valid_vote_is_accepted(election):
    """A registered voter can submit a valid ballot and affect the final tally.

    This is the positive-path baseline; rejection-only tests would not catch a
    change that accidentally prevents all voting.
    """
    creds = election.register_voter("Alice")
    ballot = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "A")
    election.cast_vote(**ballot)
    election.close_round()
    assert election.tally()["A"] == 1


def test_double_vote_is_rejected(election):
    """A voter credential cannot submit a second ballot after its first vote.

    This protects the one-vote invariant from sequential repeat submissions.
    """
    creds = election.register_voter("Bob")
    ballot1 = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "A")
    election.cast_vote(**ballot1)
    ballot2 = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "B")
    with pytest.raises(VoteRejected):
        election.cast_vote(**ballot2)


def test_forged_signature_is_rejected(election):
    """A valid signature from one voter cannot authorize another voter's ID.

    This guards the binding between a registered public key and its voter row.
    """
    victim = election.register_voter("Carol")
    attacker = election.register_voter("Mallory")
    # Attacker tries to vote using Carol's voter_id but signs with their OWN key
    forged_ballot = Election.sign_ballot(attacker["private_key_pem"], victim["voter_id"], "A")
    with pytest.raises(VoteRejected):
        election.cast_vote(**forged_ballot)


def test_unknown_candidate_is_rejected(election):
    """A correctly signed ballot still must name an allowed candidate.

    Signatures prove who submitted a ballot, not that its selection is valid.
    """
    creds = election.register_voter("Dave")
    ballot = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "NotACandidate")
    with pytest.raises(VoteRejected):
        election.cast_vote(**ballot)


def test_unregistered_voter_is_rejected(election):
    """Unknown voter IDs and unparsable signing keys cannot enter the ledger.

    This checks that ballot verification does not implicitly create a voter.
    """
    ballot = Election.sign_ballot("garbage-key", "fake-voter-id", "A")
    with pytest.raises(VoteRejected):
        election.cast_vote(**ballot)


def test_chain_detects_tampering(election):
    """Changing a mined ballot after the fact invalidates the chain.

    The test first checks the untouched chain, then mutates stored vote data to
    ensure integrity validation detects tampering rather than trusting hashes.
    """
    creds = election.register_voter("Eve")
    ballot = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "A")
    election.cast_vote(**ballot)
    election.close_round()

    valid, _ = election.verify_integrity()
    assert valid is True

    # Tamper with the stored vote directly on the chain
    election.chain.chain[1].votes[0]["encrypted_candidate"] = "tampered"

    valid, message = election.verify_integrity()
    assert valid is False
    assert "tampered" in message.lower()


def test_genesis_chain_starts_valid(election):
    """An election with no ballots still begins with a valid ledger."""
    valid, _ = election.verify_integrity()
    assert valid is True


def test_client_supplied_public_key_registration(election):
    """A voter can register a browser-generated public key and cast with it.

    The private key stays with the client; this protects the client-key
    registration path from regressions to server-generated voter keys.
    """
    from votesetu_core import crypto_utils
    private_pem, public_pem = crypto_utils.generate_keypair()
    voter_id = election.register_voter_with_key("Frank", public_pem)

    ballot = Election.sign_ballot(private_pem, voter_id, "A")
    election.cast_vote(**ballot)
    election.close_round()
    assert election.tally()["A"] == 1


def test_registration_persists_official_ballot_location(election):
    """Registration stores authoritative ballot geography with the voter.

    Casting then exercises the persisted voter row, guarding against location
    data being accepted only transiently or omitted from the registry.
    """
    from votesetu_core import crypto_utils

    private_pem, public_pem = crypto_utils.generate_keypair()
    voter_id = election.register_voter_with_key(
        "Official Roll Voter",
        public_pem,
        state="Uttar Pradesh",
        city="Greater Noida",
        area="Alpha",
    )

    voter = election.registry.get_voter(voter_id)
    assert voter["state"] == "Uttar Pradesh"
    assert voter["city"] == "Greater Noida"
    assert voter["area"] == "Alpha"

    ballot = Election.sign_ballot(private_pem, voter_id, "A")
    election.cast_vote(**ballot)
    assert election.registry.get_voter(voter_id)["has_voted"] == 1


def test_government_roll_import_requires_ridtp_link(tmp_path):
    """Only verified RIDTP-linked records become eligible for this election.

    The test also checks that a higher-sequence ineligible correction revokes
    the prior eligible decision, so an outdated decision cannot stay active.
    """
    roll = GovernmentRoll(
        db_path=str(tmp_path / "government_roll.db"),
        ridtp_directory="government_demo/ridtp_directory.json",
    )

    eligible = roll.import_file("government_demo/inbox/eligible_voter.json")
    unlinked = roll.import_file("government_demo/inbox/missing_ridtp_link.json")

    assert eligible["decision"] == "eligible"
    assert unlinked["decision"] == "needs_ridtp_link"
    assert roll.eligible_record("gbnagar-local-2027", eligible["ridtp_rid"])["official_voter_id"] == "DEMO-UP-0001"
    assert roll.eligible_record("gbnagar-local-2027", "ridtp-demo-missing") is None

    corrected = json.loads(Path("government_demo/inbox/eligible_voter.json").read_text(encoding="utf-8"))
    corrected["eligible"] = False
    corrected["roll_sequence"] = eligible["roll_sequence"] + 1
    corrected_path = tmp_path / "corrected.json"
    corrected_path.write_text(json.dumps(corrected), encoding="utf-8")
    assert roll.import_file(str(corrected_path))["decision"] == "ineligible"
    assert roll.eligible_record("gbnagar-local-2027", "ridtp-demo-alice") is None


def test_government_roll_rejects_stale_record_versions(tmp_path):
    """Older or conflicting revisions cannot undo a newer roll decision.

    Exact replays at the same sequence are idempotent, but changed data must
    use a higher sequence. This prevents import-order rollback and silent
    same-version edits from changing voter eligibility.
    """
    roll = GovernmentRoll(
        db_path=str(tmp_path / "government_roll.db"),
        ridtp_directory="government_demo/ridtp_directory.json",
    )
    record = json.loads(Path("government_demo/inbox/eligible_voter.json").read_text(encoding="utf-8"))
    record["roll_sequence"] = 1
    initial_path = tmp_path / "initial.json"
    initial_path.write_text(json.dumps(record), encoding="utf-8")
    assert roll.import_file(str(initial_path))["decision"] == "eligible"
    first_import = roll.eligible_record("gbnagar-local-2027", record["ridtp_rid"])
    replay = roll.import_file(str(initial_path))
    replayed_import = roll.eligible_record("gbnagar-local-2027", record["ridtp_rid"])
    assert replay["decision"] == "eligible"
    assert replayed_import["imported_at"] == first_import["imported_at"]

    corrected = dict(record, eligible=False, roll_sequence=2)
    corrected_path = tmp_path / "corrected.json"
    corrected_path.write_text(json.dumps(corrected), encoding="utf-8")
    assert roll.import_file(str(corrected_path))["decision"] == "ineligible"

    conflicting = dict(corrected, eligible=True)
    conflicting_path = tmp_path / "conflicting.json"
    conflicting_path.write_text(json.dumps(conflicting), encoding="utf-8")
    assert roll.import_file(str(conflicting_path))["decision"] == "rejected"

    stale_path = tmp_path / "stale.json"
    stale_path.write_text(json.dumps(record), encoding="utf-8")
    stale = roll.import_file(str(stale_path))
    assert stale["decision"] == "rejected"
    assert roll.eligible_record("gbnagar-local-2027", "ridtp-demo-alice") is None


@pytest.mark.parametrize("sequence", [0, -1, True, "2", 1.5, None])
def test_government_roll_rejects_invalid_record_revision(tmp_path, sequence):
    """Revision values must be positive integers, not booleans or coercions.

    SQLite and Python can coerce values in surprising ways, so input validation
    must happen before a revision is compared or stored.
    """
    roll = GovernmentRoll(
        db_path=str(tmp_path / "government_roll.db"),
        ridtp_directory="government_demo/ridtp_directory.json",
    )
    record = json.loads(Path("government_demo/inbox/eligible_voter.json").read_text(encoding="utf-8"))
    record["roll_sequence"] = sequence
    record_path = tmp_path / "invalid_revision.json"
    record_path.write_text(json.dumps(record), encoding="utf-8")

    result = roll.import_file(str(record_path))

    assert result["decision"] == "rejected"
    assert "roll_sequence" in result["reason"]
    assert roll.eligible_record("gbnagar-local-2027", "ridtp-demo-alice") is None


def test_government_roll_requires_record_revision(tmp_path):
    """A record without its revision is rejected before it can be stored."""
    roll = GovernmentRoll(
        db_path=str(tmp_path / "government_roll.db"),
        ridtp_directory="government_demo/ridtp_directory.json",
    )
    record = json.loads(Path("government_demo/inbox/eligible_voter.json").read_text(encoding="utf-8"))
    record.pop("roll_sequence")
    record_path = tmp_path / "missing_revision.json"
    record_path.write_text(json.dumps(record), encoding="utf-8")

    result = roll.import_file(str(record_path))

    assert result["decision"] == "rejected"
    assert "roll_sequence" in result["reason"]
    assert roll.eligible_record("gbnagar-local-2027", "ridtp-demo-alice") is None


def test_vote_endpoint_rejects_cross_site_requests():
    """The vote endpoint rejects a cross-origin mutation before vote handling.

    This is a regression check for the browser-origin defense against
    cross-site request forgery.
    """
    from app import app

    client = app.test_client()
    response = client.post(
        "/votes/cast",
        json={"voter_id": "fake", "candidate": "A", "timestamp": 0, "signature": "fake"},
        headers={"Origin": "https://attacker.example"},
    )
    assert response.status_code == 403


def test_merkle_receipt_verifies(election):
    """A mined ballot's receipt verifies, while altered proof data does not.

    Voters need a verifiable inclusion proof without trusting the UI response.
    """
    creds = election.register_voter("Grace")
    ballot = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "B")
    election.cast_vote(**ballot)
    election.close_round()

    receipt = election.get_receipt(creds["voter_id"])
    assert Election.verify_receipt(receipt) is True

    # A tampered receipt must fail verification
    tampered = dict(receipt)
    tampered["vote"] = dict(receipt["vote"])
    tampered["vote"]["ballot_id"] = "tampered-ballot"
    assert Election.verify_receipt(tampered) is False


def test_receipt_unavailable_before_mining(election):
    """A pending ballot has no receipt until it is included in a mined block.

    This prevents the app from presenting an inclusion proof prematurely.
    """
    creds = election.register_voter("Henry")
    ballot = Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "A")
    election.cast_vote(**ballot)
    # not yet mined
    with pytest.raises(VoteRejected):
        election.get_receipt(creds["voter_id"])


def test_weak_public_key_is_rejected(election):
    """Registration refuses an RSA key below the configured minimum size.

    Weak keys reduce the cost of forging signatures, so validate key strength
    at registration instead of relying on clients to generate secure keys.
    """
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization

    weak_priv = rsa.generate_private_key(public_exponent=65537, key_size=1024)
    weak_pub_pem = weak_priv.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()

    with pytest.raises(ValueError):
        election.register_voter_with_key("Weak Key Person", weak_pub_pem)


def test_stale_ballot_timestamp_is_rejected(election):
    """A valid signature cannot make a ballot outside the freshness window valid.

    This protects against replaying previously signed ballots after their
    allowed submission period.
    """
    import time as time_module
    from votesetu_core import crypto_utils

    creds = election.register_voter("Ivan")
    stale_ts = int(time_module.time() * 1000) - (10 * 60 * 1000)  # 10 minutes ago
    message = Election.build_ballot_message(creds["voter_id"], "A", stale_ts)
    signature = crypto_utils.sign_message(creds["private_key_pem"], message)

    with pytest.raises(VoteRejected):
        election.cast_vote(voter_id=creds["voter_id"], candidate="A", timestamp=stale_ts, signature=signature)


def test_concurrent_double_vote_attempts_allow_exactly_one(election):
    """Exactly one of many concurrent ballots from one voter is accepted.

    Sequential duplicate checks miss check-then-act races; competing real
    threads verify that the registry's atomic vote guard closes that gap.
    """
    import threading

    creds = election.register_voter("Racer")
    ballots = [Election.sign_ballot(creds["private_key_pem"], creds["voter_id"], "A") for _ in range(15)]

    accepted = []
    lock = threading.Lock()

    def attempt(ballot):
        try:
            election.cast_vote(**ballot)
            with lock:
                accepted.append(1)
        except VoteRejected:
            pass

    threads = [threading.Thread(target=attempt, args=(b,)) for b in ballots]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(accepted) == 1


def test_translation_dictionary_covers_template_keys():
    """Every required template translation key exists in the UI dictionary.

    This catches missing accessibility/localization strings before a page
    displays untranslated key names or blank labels.
    """
    js_text = Path("static/js/accessibility.js").read_text(encoding="utf-8")
    required_keys = [
        "adminPanelTitle",
        "saveKey",
        "pollAdministration",
        "closeRound",
        "liveSnapshot",
        "createResetElection",
        "electionTitle",
        "candidatesOneLine",
        "powDifficulty",
        "blockExplorer",
        "refresh",
        "fetchReceipt",
        "yourReceipt",
    ]

    for key in required_keys:
        assert f"{key}: \"" in js_text or f"{key}: '" in js_text, f"Missing translation entry for {key}"
