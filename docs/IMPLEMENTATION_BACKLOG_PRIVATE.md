> Portfolio status: [STATUS.md](https://github.com/AndrewLamSingapore/orqevia/blob/main/STATUS.md) is the sole portfolio status reference. Each product owns its source, configuration, contracts and domain records. The [operational manifest](https://github.com/AndrewLamSingapore/orqevia/blob/main/governance/operational-manifest.json) provides dated ORQEVIA component and observation references; it does not establish deployment status.

# Observation intelligence implementation

Staged runtime design: calibrated observations -> quality flags -> rolling features -> anomaly/risk score -> hypothesis -> owner-approved experiment -> measured outcome -> Portfolio Event. Physical actuation is explicitly out of scope and remains separately approval-gated.

Implementation modules to land after repository privacy change: observation normalizer, calibration registry, rolling feature extractor, risk detector, experiment outcome recorder, PRIME event exporter, deterministic tests with synthetic fixtures. No secrets, raw private identity data, or mains-switching logic belong in the event payload.