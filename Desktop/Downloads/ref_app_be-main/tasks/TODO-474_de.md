> 🇩🇪 Deutsche Übersetzung von [`TODO-474.md`](TODO-474.md). **Englisch ist die kanonische Quelle** — bei Abweichungen gilt das englische Original.

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

# TODO-474 · Integrationstest — C&C Mixed-Source-Over-Deletion (real-PG)

**Beschreibung.** Die Over-Deletion-Guards (TODO-384/433/386) sind isoliert getestet, und der Full-Pipeline-
Char-Test (TODO-445) seedet nur `source='orbit'`. Es gibt keinen End-to-End-Test, der den vollen 7-Stage-
C&C-Flow auf einem realistischen **Mixed-Source**-Kalender fährt und kein Cross-Source-Over-Deletion prüft
— genau die Incident-Klasse, die Kundentermine kostete.

**Akzeptanzkriterien.**
- [ ] Real-Postgres-Test: einen Kalender mit HIL + HIL_V3 + orbit + google Source-Events seeden.
- [ ] Den vollen `run_clean_and_consolidate_flow` fahren; prüfen, dass nur C&C-löschbare Sources (orbit,
  google) soft-/remote-gelöscht werden; HIL / Nicht-C&C-Events überleben (DB + Google-Delete-Spy).
- [ ] Idempotenz über die volle Pipeline prüfen (zweimal laufen → stabil), nicht nur Step 1/1b.
- [ ] Gate: Integration-Suite (real-PG) grün; Docs (+`_de`).

**Notizen.** P6 — Lost-Appointment-Incident-Klasse. Erweitert TODO-445. Bau via jl/jl-workflow (TDD).
