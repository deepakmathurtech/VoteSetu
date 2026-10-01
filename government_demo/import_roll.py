"""Import one government demo record and print the eligibility decision."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from votesetu_core.government_roll import GovernmentRoll


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python government_demo/import_roll.py government_demo/inbox/voter.json")
        return 2

    roll = GovernmentRoll(
        db_path=str(ROOT / "data" / "government_roll.db"),
        ridtp_directory=str(ROOT / "government_demo" / "ridtp_directory.json"),
    )
    try:
        decision = roll.import_file(sys.argv[1])
    except (OSError, json.JSONDecodeError) as error:
        print(json.dumps({"decision": "rejected", "reason": str(error)}, indent=2))
        return 1

    decision_dir = ROOT / "government_demo" / "decisions"
    decision_dir.mkdir(exist_ok=True)
    decision_path = decision_dir / f"{Path(sys.argv[1]).stem}.decision.json"
    decision_path.write_text(json.dumps(decision, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(decision, indent=2))
    print(f"Decision file: {decision_path.relative_to(ROOT)}")
    return 0 if decision["decision"] in {"eligible", "ineligible", "needs_ridtp_link"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
