# Branch: baoanh-565/feat/todo-474-cnc-guard

**Goal.** Implement comprehensive integration testing for the 7-stage C&C pipeline with mixed sources (HIL/HIL_V3/orbit/google) and introduce safety guards to prevent cross-source over-deletion.

**Task-ID.** TODO-474
**Stream-ID.** W58

**Steps to completion** (delete the branch once all are checked):
- [ ] Create real-PG integration test in tests/integration/orbit/test_cnc_mixed_source_overdeletion.py
- [ ] Seed test calendar with HIL + HIL_V3 + orbit + google events
- [ ] Implement safety guard in app/services/v1/orbit/cleanup_service.py to protect non-C&C sources (HIL/HIL_V3)
- [ ] Verify test asserts HIL events survive and only orbit/google sources are deleted
- [ ] Verify pipeline idempotency
- [ ] gates green (tests / lint / type) + docs updated
- [ ] rebased + merged to main; branch_meta charter removed in cleanup

**Created:** 2026-06-25
**Last update:** 2026-06-25