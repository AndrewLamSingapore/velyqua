# Animal–Environment–Intervention Intelligence

**Status:** Strategic research direction — not a shipped camera, welfare, diagnostic or automated-control capability.

## Thesis

VELYQUA should develop a durable, evidence-governed understanding of the relationship between an aquatic animal, its changing environment, its biological state and its response to an intervention — rather than defining its value by proprietary sensors.

The existing product remains freshwater-first, manual-first, software-first and hardware-agnostic. Its aquarium identity, owner observations, water-test history and care events provide a foundation; they do not yet establish validated animal tracking or welfare inference.

## Pilot question

Can synchronized environmental measurements and visible group-level fish behaviour help a keeper investigate changes more effectively than periodic water tests alone?

A candidate four-week observational feasibility pilot uses one established planted tank, a fixed camera, routine water tests, a temperature logger, and a verified dissolved-oxygen probe only if available and justified. Record camera occlusion, time of day, feeding, cleaning, flow changes, lighting, plant rearrangement, equipment maintenance, and relevant husbandry context. Do not provoke harmful conditions or delay necessary care.

## Evidence pipeline

1. Record aquarium identity, timestamp, source, units, method, calibration, freshness, quality and provenance.
2. Preserve immutable raw readings and original video/annotations under owner-controlled privacy rules.
3. Estimate group-level zone occupancy, surface presence and transitions only when video quality permits; otherwise mark unavailable.
4. Align behaviour summaries with environmental observations by timestamp and known uncertainty.
5. Separate observed association, reviewed risk interpretation, keeper action and measured outcome.
6. Preserve rule/model version, input snapshot, uncertainty and replayable decisions.
7. Compare periodic-testing-only, sensor-only and sensor-plus-camera approaches using labelled events, false alerts, missed events, valid lead time and operating burden.
8. Report inconclusive metrics when the number of validated events is too small.

**Individual-animal histories are a future research path**, contingent on defensible identification across occlusion and re-identification errors. Group-level patterns come first.

## Public demonstration protocol

The educational presentation may use a *simulated* oxygen value of 7.2 to 6.7 mg/L and simulated surface occupancy of 9% to 26% at minute 30. These are illustrative values, not real measurements, species-specific safety thresholds, validated alerts or a diagnosis.

A simulated planted-zone occupancy change from 27% to 33% demonstrates how an analysis could be presented; it is not evidence that fish welfare improved, nor proof of a real behavioural response.

## Software and DevOps boundary

**Current repository:** React Native / Expo / TypeScript experience, local-first SQLite records, Supabase-backed account-scoped sync, deterministic rules, automated checks and documented prototype telemetry contracts.

**Candidate extension:** Python video/telemetry analysis developed with VS Code, run and tested in Ubuntu/Bash, optionally packaged in Docker and evaluated with GitHub Actions. Cloud processing and Kubernetes are conditional design choices, not verified existing deployments or prerequisites.

Any future pipeline must fail visibly on stale sensors, blocked video, inconsistent timestamps and application errors. Physical aquarium equipment operates independently of application and internet availability. No autonomous dosing, diagnosis, medication prescription or automatic equipment control is authorized.

## Promotion gates

- Privacy, retention and consent review for aquarium video.
- Species-appropriate husbandry review and an approved observation protocol.
- Sensor accuracy, drift, calibration and time-alignment evidence.
- Camera occlusion, detection and bias characterization.
- Predeclared evaluation labels and leakage-controlled validation.
- Repeatability across days, environmental conditions and ideally tanks.
- Demonstrated incremental decision value over simpler baselines.
- Review of operating cost, reliability, accessibility and owner comprehension.
- Controlled approval under existing product constitution, architecture decisions, capability registry and release gates.

This document is a research direction, not an override of the locked MVP, prototype V0, or canonical portfolio operational status.
