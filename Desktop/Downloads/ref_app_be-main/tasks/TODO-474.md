+++
id = "TODO-474"
title = "Integration test: C&C full 7-stage pipeline with mixed sources (HIL+orbit+google) asserts no cross-source over-deletion"
stream = "W58"
bucket = "Prevention"
prio = "P6"
status = "wip"
agent = ""baoanh-565""
commit = "WIP"
date = "2026-06-25"
deps = []
reference = [
  "`docs/refinement/20260624-integration-test-coverage-audit.md` (gap #5)",
  "`app/services/v1/orbit/cleanup_service.py` run_clean_and_consolidate_flow (7-stage); existing char test test_cnc_real_postgres_characterization_todo445.py seeds only source='orbit'",
  "over-deletion incidents: docs/findings/20260618-clean-consolidate-overdelete-incident, 20260622-cnc-google-side-overdeletion-incident; guards TODO-384/433/386",
]
+++

> 🇩🇪 Deutsche Übersetzung: [`TODO-474_de.md`](TODO-474_de.md). **English is the canonical source** — on divergence the English original wins.

# TODO-474 · Integration test — C&C mixed-source over-deletion (real-PG)

**Description.** The over-deletion guards (TODO-384/433/386) are tested in isolation, and the full
pipeline char test (TODO-445) seeds only `source='orbit'`. There is no end-to-end test that runs the
full 7-stage C&C flow on a realistic **mixed-source** calendar and asserts no cross-source
over-deletion — the exact incident class that cost customer appointments.

**Acceptance criteria.**
- [ ] Real-Postgres test: seed a calendar with HIL + HIL_V3 + orbit + google source events.
- [ ] Run the full `run_clean_and_consolidate_flow`; assert only C&C-deletable sources (orbit, google)
  are soft-deleted/remote-deleted; HIL / non-C&C events survive (DB + Google-delete spy).
- [ ] Assert idempotency across the full pipeline (run twice → stable), not only Step 1/1b.
- [ ] Gate: integration suite (real-PG) green; docs (+`_de`).

**Notes.** P6 — lost-appointment incident class. Extends TODO-445. Build via jl/jl-workflow (TDD).
