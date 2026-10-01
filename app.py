"""
app.py
------
VoteSetu REST API + web frontend.

Security model (now matches the README's stated best practice):
  Voters generate their RSA keypair IN THE BROWSER via the Web Crypto
  API (see static/js/register.js). Only the PUBLIC key is ever sent to
  `/voters/register`. The private key is downloaded straight to the
  voter's device and never touches this server. Ballots are signed
  client-side too -- this server only ever sees a signature, never a
  private key.

Additional hardening in this version:
  * Admin endpoints require a per-run admin key (printed to the console
    at startup) -- previously anyone could reset the election or force
    a block to be mined.
  * A lightweight in-memory rate limiter throttles registration/voting
    per IP (see `rate_limit` below). This is process-local and meant for
    a single-instance demo; a real multi-process deployment would need
    a shared store (e.g. Redis) instead.
  * Security response headers + a request body size cap are applied.
  * `Election.cast_vote` itself now closes a double-vote race condition
    and enforces a ballot freshness window (see election.py).

Endpoints:
  GET  /                          -> web frontend (dashboard)
  GET  /register                  -> registration page (client-side keygen)
  GET  /vote                      -> voting page (client-side signing)
  GET  /verify                    -> receipt verification page
  GET  /explorer                  -> block explorer page
  GET  /admin                     -> admin panel (requires admin key)

  POST /election                  -> (admin) create/reset the election
  POST /voters/register           -> register with a CLIENT-SUPPLIED public key
  POST /votes/cast                -> cast a signed ballot
  POST /admin/close-round         -> mine pending votes into a block
  GET  /votes/receipt/<voter_id>  -> Merkle receipt for a mined vote
  POST /votes/verify              -> verify a receipt's Merkle proof
  GET  /results                   -> live tally
  GET  /chain                     -> full blockchain (public audit trail)
  GET  /chain/validate             -> integrity check
  GET  /stats                     -> election statistics
"""

from __future__ import annotations

import secrets
import time
import json
import os
import hashlib
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from collections import defaultdict, deque
from functools import wraps
from threading import Lock

from flask import Flask, request, jsonify, render_template

from votesetu_core.election import Election, VoteRejected
from votesetu_core.government_roll import GovernmentRoll

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024  # 64 KB request body cap (DoS mitigation)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("VOTESETU_COOKIE_SECURE", "true").lower() in {"1", "true", "yes", "on"}
app.config["PROPAGATE_EXCEPTIONS"] = False
RIDTP_AUTH_URL = os.environ.get("RIDTP_AUTH_URL", "http://localhost:4000").rstrip("/")
ACTIVE_ELECTION_ID = "gbnagar-local-2027"
PROJECT_ROOT = Path(__file__).resolve().parent
government_roll = GovernmentRoll(
    db_path=str(PROJECT_ROOT / "data" / "government_roll.db"),
    ridtp_directory=str(PROJECT_ROOT / "government_demo" / "ridtp_directory.json"),
)


def ridtp_request(path: str, method: str = "GET", payload: dict | None = None, token: str | None = None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = Request(f"{RIDTP_AUTH_URL}{path}", data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=3) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        if isinstance(error, HTTPError):
            try:
                return error.code, json.loads(error.read().decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
        return 503, {"message": "RIDTP Auth is unavailable. Start the RIDTP Auth service on port 4000."}


def current_ridtp_profile():
    token = request.cookies.get("ridtp_session")
    if not token:
        return None
    status, data = ridtp_request("/api/auth/me", token=token)
    if status != 200:
        return None
    return data.get("profile")


def current_credential_session():
    token = request.cookies.get("ridtp_session")
    if not token:
        return None
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def profile_rid(profile):
    return profile.get("sub") or profile.get("rid") or profile.get("ridtp_rid") if profile else None


def is_verified_ridtp_profile(profile):
    return bool(
        profile
        and profile.get("status") == "active"
        and profile.get("trustBand") in {"VERIFIED_HIGH", "VERIFIED"}
        and profile_rid(profile)
    )


def current_government_record(profile):
    """Return the authority-approved record for the signed-in RIDTP subject."""
    ridtp_rid = profile_rid(profile)
    return government_roll.eligible_record(ACTIVE_ELECTION_ID, ridtp_rid) if ridtp_rid else None


def require_same_origin(view):
    """Reject cross-site browser requests to voter state-changing routes."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        origin = request.headers.get("Origin")
        if not origin or origin.rstrip("/") != request.host_url.rstrip("/"):
            return jsonify({"error": "Cross-site voter requests are not allowed."}), 403
        return view(*args, **kwargs)
    return wrapped

# ---------------------------------------------------------------------- #
# Admin authentication
# ---------------------------------------------------------------------- #
# A fresh admin key is generated every time the server starts and printed
# below. It must be sent as the `X-Admin-Key` header on admin endpoints.
# This is deliberately simple (no user accounts / KYC) -- its only job is
# to stop anonymous visitors from resetting the election or forcing a
# mining round, not to model real election-official identity.
#
# NOTE: __main__ below runs with use_reloader=False specifically so this
# module (and this key) is only ever generated/printed once per process,
# instead of once in a reloader parent and again in its child.
ADMIN_KEY = os.environ.get("VOTESETU_ADMIN_KEY") or secrets.token_urlsafe(24)
print("=" * 64)
print("  VoteSetu admin key (required for /election and /admin/close-round):")
print(f"  {ADMIN_KEY}")
print("=" * 64)


def require_admin(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        supplied = request.headers.get("X-Admin-Key", "")
        if not secrets.compare_digest(supplied, ADMIN_KEY):
            return jsonify({"error": "Missing or invalid admin key."}), 401
        return view(*args, **kwargs)
    return wrapped


# ---------------------------------------------------------------------- #
# Lightweight per-IP rate limiting (in-memory, single-process demo only)
# ---------------------------------------------------------------------- #
_rate_lock = Lock()
_rate_buckets: dict = defaultdict(deque)


def rate_limit(max_calls: int, window_seconds: float):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            key = (view.__name__, request.remote_addr or "unknown")
            now = time.time()
            with _rate_lock:
                bucket = _rate_buckets[key]
                while bucket and now - bucket[0] > window_seconds:
                    bucket.popleft()
                if len(bucket) >= max_calls:
                    return jsonify({
                        "error": f"Rate limit exceeded ({max_calls} requests per "
                                 f"{int(window_seconds)}s). Please wait and try again."
                    }), 429
                bucket.append(now)
            return view(*args, **kwargs)
        return wrapped
    return decorator


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    # Everything is served same-origin with no external CDN dependencies,
    # so a strict CSP is possible without breaking the app.
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; connect-src 'self'"
    )
    return response


# A single demo election, held in memory + backed by SQLite for voters.
ELECTION_CATALOG = [
    {
        "id": "up-assembly-2027",
        "title": "Uttar Pradesh Legislative Assembly Election",
        "level": "State election",
        "location": "Uttar Pradesh / Gautam Buddha Nagar / Dadri",
        "status": "Schedule to be announced",
        "note": "Use the official Election Commission notice for the final dates and constituency roll.",
    },
    {
        "id": "gbnagar-local",
        "title": "Gautam Buddha Nagar local body election",
        "level": "Local election",
        "location": "Uttar Pradesh / Greater Noida",
        "status": "Watch for official notification",
        "note": "Ward and polling-station details are not published here yet.",
    },
]

VALID_BALLOT_LOCATIONS = {
    "Uttar Pradesh": {
        "Greater Noida": {"Alpha", "Beta", "Knowledge Park", "Pari Chowk", "Surajpur", "Yamuna Expressway"},
    },
}

CANDIDATE_DETAILS = {
    "Community Candidate A": {
        "party": "Demo civic group",
        "symbol": "Demo symbol A",
        "summary": "Placeholder profile. Replace with official candidate information.",
        "source_url": None,
    },
    "Community Candidate B": {
        "party": "Demo civic group",
        "symbol": "Demo symbol B",
        "summary": "Placeholder profile. Replace with official candidate information.",
        "source_url": None,
    },
    "Community Candidate C": {
        "party": "Independent demo profile",
        "symbol": "Demo symbol C",
        "summary": "Placeholder profile. Replace with official candidate information.",
        "source_url": None,
    },
}


election = Election(
    title="Greater Noida Civic Participation Ballot (Demo)",
    candidates=["Community Candidate A", "Community Candidate B", "Community Candidate C"],
    db_path="data/votesetu_api.db",
    difficulty=4,
)


# ---------------------------------------------------------------------- #
# Frontend pages
# ---------------------------------------------------------------------- #
@app.get("/")
def home():
    return render_template("index.html", election=election, election_catalog=ELECTION_CATALOG, candidate_details=CANDIDATE_DETAILS)


@app.get("/register")
def register_page():
    return render_template("register.html", election=election)


@app.get("/vote")
def vote_page():
    return render_template("vote.html", election=election, election_catalog=ELECTION_CATALOG, candidate_details=CANDIDATE_DETAILS)


@app.get("/verify")
def verify_page():
    return render_template("verify.html", election=election)


@app.get("/explorer")
def explorer_page():
    return render_template("explorer.html", election=election)


@app.get("/admin")
def admin_page():
    return render_template("admin.html", election=election)


@app.post("/auth/login")
@rate_limit(max_calls=10, window_seconds=60)
def auth_login():
    data = request.get_json(force=True)
    status, result = ridtp_request(
        "/api/auth/login",
        method="POST",
        payload={"identifier": data.get("identifier"), "password": data.get("password")},
    )
    if status != 200:
        return jsonify({"error": result.get("message", "RIDTP authentication failed.")}), status

    session_token = result.get("sessionToken")
    response = jsonify({"status": "authenticated", "profile": result.get("profile")})
    response.set_cookie(
        "ridtp_session",
        session_token,
        httponly=True,
        samesite="Lax",
        secure=app.config["SESSION_COOKIE_SECURE"],
        max_age=7 * 24 * 60 * 60,
    )
    return response


@app.get("/auth/me")
def auth_me():
    profile = current_ridtp_profile()
    if not profile:
        return jsonify({"authenticated": False}), 401
    return jsonify({"authenticated": True, "profile": profile})


@app.post("/auth/logout")
def auth_logout():
    token = request.cookies.get("ridtp_session")
    if token:
        ridtp_request("/api/auth/logout", method="POST", token=token)
    response = jsonify({"status": "logged_out"})
    response.delete_cookie("ridtp_session", path="/", samesite="Lax", secure=app.config["SESSION_COOKIE_SECURE"])
    return response


# ---------------------------------------------------------------------- #
# API
# ---------------------------------------------------------------------- #
@app.post("/election")
@require_admin
def create_election():
    """(Admin) Reset/create the election with new title + candidates."""
    global election
    data = request.get_json(force=True)
    title = (data.get("title") or "").strip()
    candidates = data.get("candidates")
    difficulty = data.get("difficulty", 4)
    db_path = data.get("db_path", "data/votesetu_api.db")

    if not title or not candidates:
        return jsonify({"error": "title and candidates are required"}), 400
    if not (1 <= len(title) <= 200):
        return jsonify({"error": "title must be between 1 and 200 characters"}), 400
    if not isinstance(candidates, list) or not (2 <= len(candidates) <= 50):
        return jsonify({"error": "candidates must be a list of 2-50 names"}), 400
    if not isinstance(difficulty, int) or not (1 <= difficulty <= 6):
        return jsonify({"error": "difficulty must be an integer between 1 and 6"}), 400

    election = Election(title=title, candidates=candidates, db_path=db_path, difficulty=difficulty)
    return jsonify({"message": "Election created.", "title": title, "candidates": candidates}), 201


@app.post("/admin/government-roll/import")
@require_admin
def import_government_roll_file():
    """(Admin) Process one JSON file from the government demo inbox."""
    data = request.get_json(force=True)
    requested_path = Path(data.get("path", ""))
    inbox = (PROJECT_ROOT / "government_demo" / "inbox").resolve()
    source_path = (PROJECT_ROOT / requested_path).resolve()
    if inbox not in source_path.parents or source_path.suffix.lower() != ".json":
        return jsonify({"error": "Only JSON files inside government_demo/inbox may be imported."}), 400
    try:
        decision = government_roll.import_file(str(source_path), ACTIVE_ELECTION_ID)
    except (OSError, ValueError, TypeError, json.JSONDecodeError) as error:
        return jsonify({"error": f"Government roll import failed: {error}"}), 400
    return jsonify(decision), 201 if decision["decision"] == "eligible" else 200


@app.post("/voters/register")
@rate_limit(max_calls=10, window_seconds=60)
@require_same_origin
def register_voter():
    """
    Body: { "full_name": "...", "public_key_pem": "-----BEGIN PUBLIC KEY-----..." }
    The public key is generated client-side (see static/js/register.js
    using the Web Crypto API). This server NEVER receives a private key.

    Real-world election flows should source official state/city/area values
    from the authority's roll, not from the browser. The demo keeps a fixed
    default area until that integration is wired in.
    """
    profile = current_ridtp_profile()
    if not profile:
        return jsonify({"error": "Sign in with RIDTP before generating a voting key."}), 401
    if not is_verified_ridtp_profile(profile):
        return jsonify({"error": "A verified RIDTP identity is required to register as a voter."}), 403
    government_record = current_government_record(profile)
    if not government_record:
        return jsonify({
            "error": "No eligible government-roll record is linked to this RIDTP identity for the current election.",
            "next_step": "Ask the election authority to import the voter record and link the RIDTP subject.",
        }), 403

    data = request.get_json(force=True)
    full_name = data.get("full_name")
    public_key_pem = data.get("public_key_pem")
    if not full_name or not public_key_pem:
        return jsonify({"error": "full_name and public_key_pem are required"}), 400
    if len(public_key_pem) > 4000:
        return jsonify({"error": "public_key_pem is unexpectedly large"}), 400

    verified_name = government_record["full_name"]
    state = government_record["state"]
    city = government_record["city"]
    area = government_record["area"]

    try:
        voter_id = election.register_voter_with_key(
            verified_name,
            public_key_pem,
            profile_rid(profile),
            current_credential_session(),
            state=state,
            city=city,
            area=area,
        )
    except ValueError as e:
        message = str(e)
        status = 409 if "already registered" in message else 400
        return jsonify({"error": message}), status

    return jsonify({"message": "Voter registered.", "voter_id": voter_id}), 201


@app.post("/voters/credential")
@rate_limit(max_calls=5, window_seconds=60)
@require_same_origin
def rotate_voter_credential():
    """Create or rotate the session-bound public credential.

    The private key is generated and retained by the browser. The server
    stores only the replacement public key and keeps the stable voter ID.
    Rotation is forbidden once a ballot has been accepted.
    """
    profile = current_ridtp_profile()
    if not profile:
        return jsonify({"error": "Sign in with RIDTP before creating a voting credential."}), 401
    if not is_verified_ridtp_profile(profile):
        return jsonify({"error": "A verified RIDTP identity is required."}), 403
    government_record = current_government_record(profile)
    if not government_record:
        return jsonify({
            "error": "No eligible government-roll record is linked to this RIDTP identity for the current election.",
            "next_step": "Ask the election authority to import the voter record and link the RIDTP subject.",
        }), 403

    data = request.get_json(force=True)
    public_key_pem = data.get("public_key_pem")
    if not public_key_pem or len(public_key_pem) > 4000:
        return jsonify({"error": "A valid public key is required."}), 400

    ridtp_rid = profile_rid(profile)
    credential_session = current_credential_session()
    voter = election.registry.get_voter_by_ridtp(ridtp_rid)
    try:
        if voter is None:
            voter_id = election.register_voter_with_key(
                government_record["full_name"],
                public_key_pem,
                ridtp_rid,
                credential_session,
                state=government_record["state"],
                city=government_record["city"],
                area=government_record["area"],
            )
            return jsonify({"message": "Voting credential created.", "voter_id": voter_id, "rotated": False}), 201

        election.rotate_voter_key(voter["voter_id"], ridtp_rid, public_key_pem, credential_session)
    except ValueError as error:
        return jsonify({"error": str(error)}), 409

    return jsonify({"message": "Session voting credential rotated.", "voter_id": voter["voter_id"], "rotated": True}), 200


@app.post("/votes/cast")
@rate_limit(max_calls=20, window_seconds=60)
@require_same_origin
def cast_vote():
    """
    Body:
    {
      "voter_id": "...",
      "candidate": "...",
      "timestamp": 1234567890123,
      "signature": "base64..."
    }
    Built + signed client-side in the browser (static/js/vote.js).
    """
    profile = current_ridtp_profile()
    if not profile:
        return jsonify({"error": "Sign in with RIDTP before voting."}), 401
    if not is_verified_ridtp_profile(profile):
        return jsonify({"error": "A verified RIDTP identity is required to vote."}), 403
    government_record = current_government_record(profile)
    if not government_record:
        return jsonify({"error": "This RIDTP identity has no current eligible government-roll record."}), 403

    data = request.get_json(force=True)
    required = {"voter_id", "candidate", "timestamp", "signature"}
    if not required.issubset(data):
        return jsonify({"error": f"Missing fields, required: {sorted(required)}"}), 400

    voter = election.registry.get_voter(data["voter_id"])
    if not voter or voter.get("ridtp_rid") != profile_rid(profile):
        return jsonify({"error": "This voter credential is not bound to the signed-in RIDTP identity."}), 403
    if voter.get("credential_session") != current_credential_session():
        return jsonify({"error": "This voting credential is not active for the current RIDTP session."}), 403
    if any(voter.get(field) != government_record.get(field) for field in ("state", "city", "area")):
        return jsonify({"error": "Voter location does not match the current government-roll record."}), 403

    state = voter.get("state")
    city = voter.get("city")
    area = voter.get("area")
    valid_areas = VALID_BALLOT_LOCATIONS.get(state, {}).get(city, set())
    if not isinstance(state, str) or not isinstance(city, str) or not isinstance(area, str) or area not in valid_areas:
        return jsonify({"error": "This voter is not eligible for a valid official ballot in the current election."}), 403

    try:
        election.cast_vote(
            voter_id=data["voter_id"],
            candidate=data["candidate"],
            timestamp=data["timestamp"],
            signature=data["signature"],
        )
    except VoteRejected as e:
        return jsonify({"error": str(e)}), 403

    return jsonify({"message": "Vote accepted and queued for the next block."}), 202


@app.post("/admin/close-round")
@require_admin
def close_round():
    try:
        block = election.close_round()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({
        "message": "Pending votes mined into a new block.",
        "block_index": block.index,
        "block_hash": block.hash,
        "merkle_root": block.merkle_root,
        "votes_in_block": len(block.votes),
    }), 201


@app.get("/votes/receipt/<voter_id>")
def get_receipt(voter_id):
    profile = current_ridtp_profile()
    if not profile or not is_verified_ridtp_profile(profile):
        return jsonify({"error": "A verified RIDTP session is required to retrieve a receipt."}), 401
    voter = election.registry.get_voter(voter_id)
    if not voter or voter.get("ridtp_rid") != profile_rid(profile):
        return jsonify({"error": "This receipt is not owned by the signed-in RIDTP identity."}), 403
    try:
        receipt = election.get_receipt(voter_id)
    except VoteRejected as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(receipt)


@app.post("/votes/verify")
def verify_receipt():
    """Body: a receipt object (as returned by /votes/receipt/<voter_id>)."""
    receipt = request.get_json(force=True)
    try:
        valid = Election.verify_receipt(receipt)
    except (KeyError, TypeError):
        return jsonify({"error": "Malformed receipt."}), 400
    return jsonify({"valid": valid})


@app.get("/results")
def results():
    return jsonify({
        "title": election.title,
        "results": election.tally(),
    })


@app.get("/chain")
def chain():
    return jsonify(election.audit_trail())


@app.get("/chain/validate")
def validate_chain():
    valid, message = election.verify_integrity()
    return jsonify({"valid": valid, "message": message})


@app.get("/stats")
def stats():
    return jsonify(election.stats())


if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)

