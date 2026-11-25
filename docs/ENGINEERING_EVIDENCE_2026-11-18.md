# VELYQUA engineering evidence baseline — 18 November 2026

**Status:** Read-only findings captured for review. This document is an audit record, not a release certificate. No application source or production configuration was changed.

## Evidence verified from GitHub

- Baseline: `main@f70e8b044755133ac714d19a2e8b88607ca57f93` (public walkthrough documentation refresh).
- Scheduled Quality run [#359](https://github.com/AndrewLamSingapore/velyqua/actions/runs/44016690109), created 17 November 2026, completed with GitHub conclusion **success**. This is evidence that this workflow run passed, not independent physical-device, production-security or scientific validation.
- `.github/workflows/quality.yml` defines `npm ci`, `npm run verify`, `npm run export:ios`, and a non-PR production smoke job.
- `.github/workflows/status-authority.yml` checks portfolio status consistency.
- `package.json` declares version **0.4.0**, Expo 57, React Native 0.86.3, TypeScript, Vitest and Node 22.
- `src/storage/sqliteTankStore.ts` implements account-keyed SQLite record/outbox and migration structures. Actual interruption and cross-account durability require device-level testing.
- `src/product/PublicProofExperience.tsx` implements a four-step **synthetic educational walkthrough**. Its figures are illustrative; it does not implement camera-derived welfare inference.
- `src/os/capabilities.ts` explicitly distinguishes working, foundation and planned capabilities.
- `docs/ANIMAL_ENVIRONMENT_INTELLIGENCE.md` describes a proposed observational pilot and scientific promotion gates. It does not claim validated individual-animal tracking.
- Open standalone issues: [#1](https://github.com/AndrewLamSingapore/velyqua/issues/1) safety-oriented concern triage and [#3](https://github.com/AndrewLamSingapore/velyqua/issues/3) minimum hardware / fusion experiment.
- Open dependency PRs: [#93](https://github.com/AndrewLamSingapore/velyqua/pull/93), [#98](https://github.com/AndrewLamSingapore/velyqua/pull/98), [#99](https://github.com/AndrewLamSingapore/velyqua/pull/99), [#100](https://github.com/AndrewLamSingapore/velyqua/pull/100), [#101](https://github.com/AndrewLamSingapore/velyqua/pull/101). Review the Expo SDK compatibility matrix before merging.
- The repository has **no declared license** as of this review. A public repository is not automatically open-source licensed.
- `SECURITY.md` calls version 0.3 supported and `PRIVACY.md` describes 0.3, while the package is 0.4.0. Verify actual release/deployment scope before revising legal statements.

## Priority work and acceptance criteria

| Priority | Action | Acceptance evidence |
| --- | --- | --- |
| P0 | Reconcile supported/released version claims | Package, deployed release, SECURITY and PRIVACY agree or explicitly distinguish source vs deployed versions |
| P0 | Review dependency PRs as a compatible set | Expo compatibility check, green CI, regression tests, documented upgrade decision |
| P0 | Independently test RLS/account isolation | Negative tests show no cross-account read, write or delete |
| P0 | Test offline transaction durability | Device interruption/restart/retry scenarios with no acknowledged data loss |
| P0 | Verify deployment provenance | Deployed revision, health checks, smoke evidence and timestamp recorded |
| P0 | Decide repository license | Owner-approved license or explicit proprietary contribution policy |
| P1 | Publish reproducible synthetic demo fixture | Deterministic scenario, commands, limitations, no live-animal claims |
| P1 | Validate accessibility and mobile usability | Recorded device/browser matrix and findings |
| P1 | Prepare observational feasibility protocol | Consent/privacy, calibration, timestamps, baselines, confounders, evaluation criteria |
| P1 | Publish bilingual technical and research briefs | English/Chinese copy that separates shipped features from research |
| P1 | Prepare Wuhan outreach | Tailored engineering case study and supervised pilot request |

## Public-facing positioning

**Shipped software:** freshwater aquarium records, manual measurements and observations, care history, local-first storage and governed decision-support components.

**Educational demonstration:** Observe → Compare → Respond → Learn with explicitly synthetic values.

**Research hypothesis, not shipped or validated:** camera-based group behaviour, individual-animal histories, biological-state inference, intervention-outcome intelligence.

Suggested research question: *Can synchronized environmental measurements and observable group-level fish behaviour improve the quality of keeper investigation over periodic water tests alone?*

## Wuhan opportunity pathways

1. **Employment:** use the Expo/React Native, SQLite, Supabase, testing and CI architecture as a verifiable software/product-engineering case study for Wuhan technology employers.
2. **Scientific feedback:** approach the Institute of Hydrobiology, Chinese Academy of Sciences, and Huazhong Agricultural University with the observational protocol, seeking critique rather than implying endorsement.
3. **Innovation:** present a working software prototype and validation gates to Optics Valley entrepreneurship networks; independently verify program eligibility and current calls.

## Evidence limitations

This record was prepared by inspecting connected GitHub repository metadata and selected files. It does not represent a local test execution, complete codebase audit, secrets scan, penetration test, real-device test, independently confirmed live deployment, or scientific trial. The scheduled CI run's reported conclusion is sourced from GitHub; no external reproduction is claimed.

**Change policy:** Keep `main` unchanged until a human reviews and merges this audit record. Any application changes should follow as narrow, tested PRs.
