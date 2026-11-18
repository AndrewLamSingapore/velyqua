# VELYQUA — Cloud Support & Deployment (classroom presentation)

**Status:** Educational presentation and proposed architecture. **Google Cloud registration is deferred.** This document does not assert any deployed GCP service.

## Core deployment decision

Keep the existing **Vercel public web app**, **Expo / React Native / TypeScript** application, **local-first SQLite + deterministic outbox**, and **Supabase Auth + account-scoped synchronization with Row Level Security**. Evaluate **Google Cloud Run** only as an optional, isolated, noncritical analysis API after a cost, privacy, and reliability review. **Do not replace Supabase with Firestore merely to introduce GCP.**

## 12-slide presentation and speaker notes

### 1. VELYQUA — Cloud Support & Deployment
**Slide:** Current implementation versus proposed GCP extension.

**Speaker:** VELYQUA is a freshwater-first, manual-first aquatic intelligence prototype. The presentation distinguishes working software from proposed research.

### 2. Problem
**Slide:** Aquarium conditions change; periodic tests are snapshots; keepers need connected observations and follow-up.

**Speaker:** Tell the story of one fish, a changing environment, a keeper intervention, and a linked follow-up observation.

### 3. Existing implementation
**Slide:** Expo / React Native / TypeScript; Vercel web app; SQLite and outbox; Supabase authentication, synchronization, RLS.

**Speaker:** Guest records are stored on the current device; signed-in records use documented private synchronization.

### 4. Current deployment flow
**Slide:** GitHub source and checks → Vercel public web app; local SQLite → outbox → Supabase.

**Speaker:** Separate version control, quality gates, hosting and synchronization. Do not claim unverified CI/CD triggers.

### 5. AWS versus Azure versus GCP
**Slide:** AWS broad service range; Azure enterprise/Microsoft alignment; GCP Cloud Run as focused container backend candidate.

**Speaker:** No universal winner. Select a narrow, measurable Cloud Run experiment rather than migrating the product.

### 6. Proposed hybrid architecture
**Slide:** Vercel public web app + Supabase existing data plane + optional Cloud Run analysis API; optional Cloud Storage for approved research media.

**Speaker:** These GCP services are **not deployed**. Preserve operation when experimental services are unavailable.

### 7. Evidence trail
**Slide:** Observe → record environment → keeper intervention → linked follow-up.

**Speaker:** Association is not proof of causation. Individual animal identification and welfare inference are research directions.

### 8. Synthetic demonstration
**Slide:** Illustrative oxygen 7.2 → 6.7 mg/L; illustrative surface occupancy 9% → 26%.

**Speaker:** Synthetic educational numbers only; no live sensor readings, validated thresholds, diagnosis, or welfare proof.

### 9. Deployment and reliability
**Slide:** Baseline existing system → containerize optional API → validate auth/logging/latency/errors → pilot only after evidence gates.

**Speaker:** Keep equipment independent of cloud connectivity and secrets out of the client.

### 10. Cost and security
**Slide:** Free-tier-first planning; trial credits only after registration; billing alerts, instance limits, least privilege and retention controls.

**Speaker:** Budgets are not hard caps. Cloud Run, egress, storage and AI may be charged separately. Registration remains postponed.

### 11. Evidence boundaries
**Slide:** Working = manual records, sync, web, tests. Synthetic = demo figures. Proposed = Cloud Run, cameras and AI.

**Speaker:** No autonomous dosing, diagnosis, camera-derived individual tracking, or proven welfare outcomes.

### 12. Recommendation
**Slide:** Retain Vercel + Supabase; prepare Cloud Run proof-of-concept; measure value and cost; register later.

**Speaker:** Incremental, reversible cloud adoption is better than a premature full migration.

## Suggested cloud evaluation acceptance criteria

- No regression to existing account-scoped sync or public walkthrough.
- Optional API failure cannot prevent ordinary aquarium record entry.
- Authentication, secrets, privacy, logging, data retention and least privilege reviewed.
- Document request latency, errors, cost and baseline comparison.
- Synthetic examples clearly labelled; no welfare or diagnosis claims.
- No GCP credentials or billing required to complete the classroom presentation.

## References

- [Live web application](https://velyqua.vercel.app/)
- [Source and current capability description](https://github.com/AndrewLamSingapore/velyqua)
- [Engineering evidence PR #107](https://github.com/AndrewLamSingapore/velyqua/pull/107)
- [Animal–environment intelligence research protocol](ANIMAL_ENVIRONMENT_INTELLIGENCE.md)
- [Architecture decisions](ARCHITECTURE_DECISIONS.md)
