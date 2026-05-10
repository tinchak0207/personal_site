from __future__ import annotations

from pathlib import Path

from .models import GraphProposal


def write_proposal(base_dir: str, proposal: GraphProposal) -> Path:
    proposal_dir = Path(base_dir)
    proposal_dir.mkdir(parents=True, exist_ok=True)
    proposal_path = proposal_dir / f"{proposal.proposal_id}.json"
    proposal_path.write_text(
        proposal.model_dump_json(indent=2, exclude_none=True) + "\n",
        encoding="utf-8",
    )

    latest_path = proposal_dir / "latest.json"
    latest_path.write_text(proposal_path.name + "\n", encoding="utf-8")
    return proposal_path


def load_proposal(path: str) -> GraphProposal:
    proposal_path = Path(path)
    return GraphProposal.model_validate_json(proposal_path.read_text(encoding="utf-8"))


def resolve_latest_path(base_dir: str) -> Path:
    proposal_dir = Path(base_dir)
    latest_pointer = proposal_dir / "latest.json"
    if not latest_pointer.exists():
        raise FileNotFoundError(f"latest proposal pointer not found in {proposal_dir}")
    proposal_name = latest_pointer.read_text(encoding="utf-8").strip()
    return proposal_dir / proposal_name
