#!/usr/bin/env bash
#
# ADR & documentation consistency check (Rule 8 — "every change is reviewed
# against existing ADRs"). Invoked by .pre-commit-config.yaml.
#
# A git hook is deterministic and cannot reason about an ADR's *intent*. So this
# splits the work honestly, and — because it gates commits in a busy repo — it is
# deliberately scoped to NEVER false-positive-block a legitimate commit:
#
#   TIER 1 — "documentation is outdated"  (deterministic, BLOCK)
#     • dangling ADR-NNN references — an ADR-NNN cited in a staged file whose
#       number falls INSIDE this repo's own ADR range but is NOT defined in
#       docs/decisions.md (headings + Index table). In-range only, so that
#       cross-project citations ("asol-transcript ADR-023", which live OUTSIDE
#       this repo's range) are never mistaken for a local typo.
#     • broken internal markdown links in staged docs — a relative link target
#       under the repo that does not exist on disk.
#
#   TIER 2 — ADR tripwire registry  (deterministic, BLOCK)  — EMPTY by design.
#     • A scaffold for encoding ref_app_be-specific mechanical ADR invariants.
#       Ships with NO tripwires: a hardcoded invariant that is wrong for this
#       repo would wrongly block commits. Add one only when an ADR has a genuine,
#       unambiguous mechanical signal (see the template inside the TIER 2 block).
#
#   TIER 3 — deep-analysis escalation  (judgment ADRs)  — DISABLED by default.
#     • The framework is ported but gated behind ADR_DEEP_ANALYSIS=1. Off unless
#       explicitly enabled, so it never blocks a normal commit. When enabled and
#       a jurisdiction-mapped file changes, it assembles a briefing (ADR text +
#       git history + staged diff) and (optionally, best-effort) runs it through
#       the `claude` CLI; it records the verdict via ADR_REVIEWED but does not
#       block by default. The jurisdiction map also ships EMPTY (see TIER 3).
#
# Bypass entirely (you own the consequences):  git commit --no-verify

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
DECISIONS="docs/decisions.md"

afail() { printf '\n\033[31mERROR: ADR/doc consistency: %s\033[0m\n' "$*" >&2; exit 1; }
awarn() { printf '\033[33m! ADR/doc consistency: %s\033[0m\n' "$*" >&2; }
ainfo() { printf '\033[36m• %s\033[0m\n' "$*"; }

# Staged files (Added/Copied/Modified). Portable read loop (NOT mapfile — macOS
# ships bash 3.2, which lacks it).
STAGED=()
while IFS= read -r _l; do STAGED+=("$_l"); done \
    < <(git diff --cached --name-only --diff-filter=ACM)
[ ${#STAGED[@]} -eq 0 ] && exit 0

[ -f "$DECISIONS" ] || { awarn "$DECISIONS not found — skipping ADR checks"; exit 0; }

staged_match() { printf '%s\n' "${STAGED[@]}" | grep -qE "$1"; }

# ── Defined ADR ids ──────────────────────────────────────────────────────────
# This repo's ADRs are headed "## ADR-NNN · <title>" (note the '·' separator),
# but some are *reserved* and exist ONLY as an Index-table row (e.g. the
# "| ADR-014 | *(reserved by W24)* |" placeholder, which is referenced ~40× and
# must NOT count as dangling). So the defined set is the UNION of:
#   (a) ADR headings   (^#{1,3} ADR-NNN ·)
#   (b) Index-table rows ("| ADR-NNN |" or "| [ADR-NNN]")
DEFINED_ADRS="$( {
    grep -oE '^#{1,3} ADR-[0-9]+' "$DECISIONS" | grep -oE 'ADR-[0-9]+'
    grep -oE '\|[[:space:]]*(\[)?ADR-[0-9]+' "$DECISIONS" | grep -oE 'ADR-[0-9]+'
} | sort -u )"

# The repo's own ADR number range. Dangling detection is scoped to this range so
# that cross-project citations (e.g. "asol-transcript ADR-023") — which sit OUTSIDE
# the local range — are never flagged as a local typo. A genuine in-range gap
# (e.g. citing ADR-007 after deleting its definition) IS caught.
ADR_NUMS="$(printf '%s\n' "$DEFINED_ADRS" | grep -oE '[0-9]+' | sed 's/^0*//; s/^$/0/' | sort -n)"
ADR_MIN="$(printf '%s\n' "$ADR_NUMS" | head -1)"
ADR_MAX="$(printf '%s\n' "$ADR_NUMS" | tail -1)"

# ── TIER 1a — dangling ADR references (in-range only) ────────────────────────
# NOTE: no `case` inside $(...) — bash 3.2 mis-parses a case pattern's ')' as the
# end of the command substitution. Use [[ ]] / grep instead.
# Skip the ADR-consistency gate's OWN source + test from the citation scan: they
# deliberately carry synthetic/placeholder ADR tokens (e.g. ADR-000, ADR-099 test
# fixtures, the "ADR-NNN" format docstring) that are not real citations and would
# otherwise self-flag as dangling.
adr_self_re='^(scripts/hooks/checks/adr-consistency\.sh|tests/unit/scripts/test_adr_consistency_hook\.py)$'
adr_refs="$(for f in "${STAGED[@]}"; do
    [ -f "$f" ] || continue
    [[ "$f" =~ $adr_self_re ]] && continue
    git show ":$f" 2>/dev/null | grep -aoE 'ADR-[0-9]+' || true
done | sort -u)"
dangling=""
if [ -n "${ADR_MIN:-}" ] && [ -n "${ADR_MAX:-}" ]; then
    for ref in $adr_refs; do
        # Already defined? then fine.
        printf '%s\n' "$DEFINED_ADRS" | grep -qx "$ref" && continue
        n="$(printf '%s' "$ref" | grep -oE '[0-9]+' | sed 's/^0*//; s/^$/0/')"
        # In this repo's own range but not defined -> dangling (likely a typo /
        # a removed-but-still-cited local ADR). Out-of-range -> treated as a
        # cross-project / future reference and NOT flagged.
        if [ "$n" -ge "$ADR_MIN" ] && [ "$n" -le "$ADR_MAX" ]; then
            dangling="$dangling  $ref"$'\n'
        fi
    done
fi
[ -n "$dangling" ] && afail "dangling ADR reference(s) — cited but NOT defined in $DECISIONS (documentation outdated):
$dangling  These fall inside this repo's own ADR range (ADR-$(printf '%03d' "$ADR_MIN")..ADR-$(printf '%03d' "$ADR_MAX")).
  Define the ADR, fix the typo, or remove the stale reference.
  (Cross-project refs like 'asol-transcript ADR-NNN' outside this range are intentionally not flagged.)"

# ── TIER 1b — broken internal markdown links INTRODUCED by staged docs ───────
# SAFETY: this blocks only on a broken link that THIS change introduces — a link
# present in the staged blob but NOT already in the HEAD blob. Pre-existing broken
# links (historical doc drift the committer did not author) are reported as a
# warning, never a block: the gate guards *your* change, not the repo's backlog.
#
# Skipped sources:
#   • TODO.md / TODO_de.md and the roadmap-as-data source trees (tasks/**,
#     streams/**, ADR-018): their reference cells carry TASK-RELATIVE paths
#     (correct in the generated TODO.md, not from the file's own dir) by design.
# Skipped targets: external schemes (http*, mailto:, file:), pure anchors (#…).
# Fenced code blocks are stripped so illustrative links in examples are not
# flagged. FENCE is three backticks built via printf to keep them out of the awk.
FENCE="$(printf '\140\140\140')"
# extract_links <gitref> <file>: emit one BROKEN relative link target per line
# (anchors stripped) from the given blob, fenced blocks removed. <gitref> is the
# full git-show object spec for the blob — ":<file>" for the staged version,
# "HEAD:<file>" for the committed version.
extract_links() {
    local ref="$1" f="$2" dir
    dir="$(dirname "$f")"
    git show "$ref" 2>/dev/null | awk -v F="$FENCE" '$0 ~ "^"F {infence=!infence; next} !infence' \
    | grep -oE '\]\([^)]+\)' | sed -E 's/^\]\(//; s/\)$//' \
    | while IFS= read -r tgt; do
        [[ -z "$tgt" || "$tgt" == http* || "$tgt" == mailto:* || "$tgt" == file:* || "$tgt" == \#* ]] && continue
        local base="${tgt%%#*}"
        [ -z "$base" ] && continue
        # Resolvable from the file's dir or the repo root? then it's a valid link.
        { [ -e "$dir/$base" ] || [ -e "$base" ]; } && continue
        printf '%s\n' "$tgt"
    done | sort -u
}
broken=""
prior_broken=""
for f in "${STAGED[@]}"; do
    [[ "$f" == *.md ]] || continue
    [ -f "$f" ] || continue
    [[ "$f" == "TODO.md" || "$f" == "TODO_de.md" || "$f" == "TODO_archive.md" || "$f" == "TODO_archive_de.md" ]] && continue
    [[ "$f" == tasks/* || "$f" == streams/* ]] && continue
    # Broken links in the staged version, and in the committed (HEAD) version.
    # `|| true` keeps `set -e` from killing the script on a function pipeline that
    # legitimately exits non-zero (e.g. a grep with no matches mid-pipeline).
    staged_bad="$(extract_links ":$f" "$f" || true)"
    [ -z "$staged_bad" ] && continue
    head_bad="$(extract_links "HEAD:$f" "$f" 2>/dev/null || true)"
    while IFS= read -r tgt; do
        [ -z "$tgt" ] && continue
        if printf '%s\n' "$head_bad" | grep -qxF "$tgt"; then
            prior_broken="$prior_broken  $f -> $tgt"$'\n'   # pre-existing: warn only
        else
            broken="$broken  $f -> $tgt"$'\n'               # introduced: block
        fi
    done <<< "$staged_bad"
done
[ -n "$prior_broken" ] && awarn "pre-existing broken internal doc link(s) (not introduced by this commit — fix when you touch them):
$prior_broken"
[ -n "$broken" ] && afail "broken internal doc link(s) INTRODUCED by this change (documentation outdated):
$broken  Fix the path or restore the target. (Pre-existing broken links are warned, not blocked.)"

# ── TIER 2 — ADR tripwire registry (encoded mechanical invariants) ───────────
# EMPTY BY DESIGN. This is the place to encode a ref_app_be-specific ADR invariant
# that has a genuine, unambiguous MECHANICAL signal — so that when the tripwire
# passes, that ADR is verified and no human escalation is needed.
#
# Do NOT add speculative tripwires: a hardcoded invariant that is subtly wrong for
# this repo would block legitimate commits. Add one only when ALL hold:
#   • the ADR's intent maps to a deterministic grep/test on a specific file path;
#   • a false positive is implausible (the signal is unambiguous);
#   • the failure message tells the committer how to resolve it (fix code OR
#     RE-EVALUATE the ADR in docs/decisions.md).
#
# Template (copy, uncomment, adapt — keep it bash-3.2 safe, no `mapfile`):
#
#   # ADR-0NN · <one-line invariant>.
#   if staged_match '^app/path/to/file\.py$'; then
#       hits="$(for f in "${STAGED[@]}"; do
#           [[ "$f" == app/path/to/file.py ]] || continue
#           [ -f "$f" ] || continue
#           git show ":$f" 2>/dev/null | grep -nE '<forbidden-pattern>' \
#               | sed "s|^|  $f:|" || true
#       done)"
#       [ -n "$hits" ] && afail "ADR-0NN conflict — <what broke>:
#   $hits  <how to fix>. If the decision is genuinely changing, RE-EVALUATE ADR-0NN (revise $DECISIONS) first."
#   fi
#
# (No tripwires registered yet.)

# ── TIER 3 — deep-analysis escalation (judgment ADRs) — DISABLED by default ───
# DISABLED unless ADR_DEEP_ANALYSIS=1 is set in the environment, so it never
# blocks a normal commit. When enabled, a change to a jurisdiction-mapped file
# (judgment ADRs with no mechanical tripwire) assembles a briefing — the ADR text,
# the git history of the changed files AND of the ADR, and the staged diff — and,
# if the `claude` CLI is present, runs it through the CLI (best-effort). The
# verdict is recorded via ADR_REVIEWED. The jurisdiction map ships EMPTY (this
# repo's judgment ADRs are not yet wired); populate `implicate` lines as needed.
if [ "${ADR_DEEP_ANALYSIS:-0}" = "1" ]; then
    implicated=""
    implicate() { staged_match "$1" && implicated="$implicated$2|$3"$'\n'; return 0; }

    # ── jurisdiction map (EMPTY scaffold) ──────────────────────────────────
    # Map a judgment ADR (no mechanical signal) to the file glob that governs it.
    # Example (commented — adapt to a real ref_app_be judgment ADR):
    #   implicate '^app/core/injector\.py$' \
    #       'ADR-005' 'custom @Injectable DI container — must not reintroduce per-request rebuild'
    # (No jurisdictions registered yet.)

    if staged_match '^docs/decisions\.md$'; then
        awarn "$DECISIONS is being changed — confirm supersede markers are set and that the code still matches the revised decision(s)."
    fi

    if [ -n "$implicated" ]; then
        ack="${ADR_REVIEWED:-}"
        briefing="$(mktemp 2>/dev/null || echo /tmp/adr-analysis.$$)"
        {
            echo "# Deep ADR-consistency analysis"
            echo
            echo "Staged changes touch files governed by the ADR(s) below, which have NO"
            echo "mechanical tripwire. For EACH: review the ADR + the git history of the changed"
            echo "files and of the ADR, infer the intent of the change, judge whether it stays"
            echo "consistent — then EITHER fix the code OR re-evaluate (revise) the ADR."
            echo
            echo "## Staged diff"
            echo '```diff'; git diff --cached; echo '```'
            printf '%s\n' "$implicated" | while IFS= read -r line; do
                [ -z "$line" ] && continue
                adr="${line%%|*}"; concern="${line#*|}"
                echo; echo "## $adr — $concern"
                echo "### ADR text"
                sed -n "/^#\{1,3\} ${adr} /,/^---$/p" "$DECISIONS"
                echo "### Recent history of $DECISIONS"
                git log --oneline -5 -- "$DECISIONS" || true
            done
            echo; echo "## Recent history of the staged files"
            for f in "${STAGED[@]}"; do echo "### $f"; git log --oneline -3 -- "$f" || true; done
        } > "$briefing" 2>/dev/null || true

        # Best-effort automated reasoning when the CLI is available.
        if command -v claude >/dev/null 2>&1; then
            ainfo "running claude deep analysis (best-effort)…"
            claude -p "Review this commit for ADR consistency. For each ADR, answer CONSISTENT or CONFLICT with a one-line reason, and whether the ADR should be revised:

$(cat "$briefing")" 2>/dev/null || awarn "claude deep analysis failed/skipped — fall back to manual review"
        else
            awarn "claude CLI absent — deep-analysis briefing left for manual review."
        fi

        printf '\n\033[33mDeep-analysis briefing written to:\033[0m %s\n' "$briefing" >&2
        ainfo "ADR review acknowledged (ADR_REVIEWED): ${ack:-<none>}"
        # Note: TIER 3 is advisory by default — it surfaces the briefing but does
        # not block. To make it blocking, gate on ADR_REVIEWED here.
    fi
fi

ainfo "ADR/doc consistency OK"
