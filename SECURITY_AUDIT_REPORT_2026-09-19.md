# VoteSetu Local Destructive Security Audit

Date: 2026-09-19
Scope: Local Flask demo instance at `http://127.0.0.1:5000`.

> **Historical snapshot:** This report records tests against the local instance and configuration listed below on 2026-09-19. It is not a production penetration test or a statement that the current checkout has been re-audited. Use it as a record of those test results, not as a current security certification.

## Test conditions

The app was started with:

- `VOTESETU_COOKIE_SECURE=false` for local HTTP testing only
- `VOTESETU_ADMIN_KEY=audit-test-admin-key`
- Flask development server, single process

No external service, production host, or real voter data was targeted.

## Attack results

| Test | Result | Meaning |
|---|---:|---|
| Load home page | `200` | App was running normally. |
| Reset election without admin key | `401` | Anonymous destructive reset blocked. |
| Close polling round without admin key | `401` | Anonymous forced mining blocked. |
| Cross-site vote request | `403` | Same-origin protection blocked the request before voting logic. |
| Fetch receipt without RIDTP login | `401` | Receipt/status privacy protected. |
| Government import path traversal | `400` | Import restricted to JSON files inside `government_demo/inbox`. |
| Public chain read | `200` | Public audit endpoint reachable; test chain exposed no voter ID or plaintext candidate. |
| Reset election with valid admin key | `201` | **Destructive reset succeeded as designed.** The bearer admin key can recreate the election. |

## Findings

### Critical production concern: bearer admin key

Anyone who obtains `X-Admin-Key` can reset the election or close a round. The current control is suitable only for a local demo. It does not provide identity, role separation, approval history, or accountability.

Required production controls:

- separate election-official identities instead of one shared key
- two-person approval for reset, candidate changes, and poll closure
- signed append-only admin audit events
- immutable election configuration after the election opens
- key rotation and hardware-backed secret storage
- independent monitoring and alerting

### High: development server

The test instance reported Flask's development-server warning. It must not be used for an election deployment. Use a hardened WSGI server behind HTTPS with process isolation and operational monitoring.

### High: election reset endpoint

`POST /election` intentionally replaces the in-memory election object. In a real election, an election must never be reset after opening. It should be created once, assigned a signed election version, and locked before voting begins.

### Passed controls

- Unauthorized reset was blocked.
- Unauthorized forced block closing was blocked.
- Cross-site vote attempt was blocked.
- Receipt access without verified RIDTP authentication was blocked.
- Government import path traversal was blocked.
- The public chain response contained anonymous encrypted ballots rather than voter IDs and plaintext candidate choices.
- Existing automated suite at the time remained green: `17 passed` before the runtime audit.

## Practical limitations still open

- A stolen valid admin secret remains a total administrative compromise.
- The demo encryption key is process-local and is not HSM/threshold controlled.
- A local RIDTP directory is not an official government identity provider.
- Remote voting cannot by itself prevent physical coercion or vote buying.
- The Flask development deployment is not production-ready.

## Conclusion

The application resisted the unauthenticated and cross-site destruction attempts tested here. It did not resist an authorized destructive reset, because the current admin design explicitly permits it. That is the main real-world weakness found in this run: the next security improvement should be immutable election lifecycle controls with dual authorization and an append-only admin audit log, before presenting the system as an election platform.
