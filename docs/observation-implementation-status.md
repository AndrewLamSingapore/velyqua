# Observation Contract implementation — 7 September 2026

The server/bench acquisition module now validates Modbus CRC before register decoding, hashes exact source bytes, checks byte lengths, preserves correlation across retries, rejects repeated attempt IDs against supplied history, and checks acquisition-to-observation linkage. Existing Vitest CI runs its reference-vector fixtures.

This is Gate 1 groundwork, not a completed Observation Contract validator or a new ingestion endpoint. It does not assert calibration, aquatic suitability, quality, freshness, or real-hardware validation. Durable replay protection still requires atomic persistence at Gate 2; caller-supplied history alone is not production replay protection.

The latest recovered 7 September export gives quality precedence `invalid > unknown > degraded > valid`, superseding the conflicting older `invalid > degraded > unknown > valid` summary. The complete controlled flag/severity table and five fixed indeterminate reason codes were not recoverable. Preserve the frozen specification and obtain those exact values before claiming Gate 1 completion. Do not invent replacement enum values or treat unimplemented checks as unknown.

The legacy `contracts/observation.schema.json` and current device ingestion remain separate from the pending canonical Observation v1 implementation. Gates 2 and 3 require synthetic persisted flows and real CRC-valid hardware frames respectively. The soil probe remains unverified for aquatic use; no actuation is enabled.
