from __future__ import annotations

import argparse
from pathlib import Path

from .config import get_settings
from .context_loader import build_context_snapshot
from .executor import apply_proposal
from .proposal_io import load_proposal, resolve_latest_path, write_proposal
from .service import generate_proposal


def handle_generate_proposal(output_dir: str) -> int:
    settings = get_settings()
    snapshot = build_context_snapshot(settings.supabase_url, settings.supabase_service_role_key)
    result = generate_proposal(snapshot, model_name=settings.model_name)
    path = write_proposal(output_dir or settings.proposal_dir, result.proposal)
    print(path)
    return 0


def handle_apply_proposal(proposal_path: str | None, proposal_dir: str | None) -> int:
    settings = get_settings()
    resolved_path = Path(proposal_path) if proposal_path else resolve_latest_path(proposal_dir or settings.proposal_dir)
    proposal = load_proposal(str(resolved_path))
    apply_proposal(settings.supabase_url, settings.supabase_service_role_key, proposal)
    print(f"applied {resolved_path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate and apply graph proposals")
    subparsers = parser.add_subparsers(dest="command", required=True)

    generate = subparsers.add_parser("generate-proposal")
    generate.add_argument("--output-dir", default="")

    apply_cmd = subparsers.add_parser("apply-proposal")
    apply_cmd.add_argument("--proposal", default="")
    apply_cmd.add_argument("--proposal-dir", default="")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "generate-proposal":
        return handle_generate_proposal(args.output_dir)
    if args.command == "apply-proposal":
        return handle_apply_proposal(args.proposal or None, args.proposal_dir or None)
    parser.error(f"unsupported command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
