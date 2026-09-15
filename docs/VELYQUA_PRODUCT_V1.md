# VELYQUA product architecture v1

> Portfolio authority: [one current JARVIS SSOT](https://github.com/AndrewLamSingapore/prime/blob/main/governance/operational-manifest.json). This product document cannot establish PRIME runtime or production authority.

VELYQUA is a mobile-first household application for calm, evidence-led aquarium care. It owns aquarium observations and product state. ABEX PRIME owns shared person identity, invitations, trusted-device enrollment, authorization and production authority.

## Product surfaces

- **Home** summarises actual state, evidence age, node readiness and alerts.
- **Live** presents admitted physical readings and labels missing, late and simulated data.
- **History** retains owner-entered and admitted telemetry with provenance.
- **Alerts** separates INFO, WARNING, CRITICAL and RECOVERY events.
- **People** presents the one-invitation/one-device enrollment journey and fails closed until the ABEX protocol is integrated.
- **System** exposes stable node identity, firmware, commissioning evidence and connection state without secrets.

The application is responsive at phone, tablet and desktop widths. The exported web artifact includes a standalone manifest, icon and offline application shell. API responses are excluded from the service-worker cache so stale telemetry cannot be represented as live.

## Trust boundary

`contracts/prime-trusted-client-v1.schema.json` is the machine-readable integration contract. The VELYQUA adapter deliberately separates:

```text
PERSON != DEVICE != APPLICATION != INVITATION != DEVICE CREDENTIAL != SESSION
```

Only `application_id=velyqua` permissions are accepted. Expired, used and revoked invitations cannot be accepted. Durable local enrollment stores an identity binding, while the future ABEX implementation remains responsible for secure credential issuance and session refresh. The browser never receives a PRIME administrative credential.

## Telemetry boundary

`contracts/telemetry-v1.schema.json` and `api/_telemetry.js` require stable reading, sensor and node identity; a sequence; finite raw and normalized values; and a valid observation timestamp. Database uniqueness constraints give repeat deliveries exactly-once persistence. Late data is retained as `SUSPECT`; future/invalid data and simulated production ingestion are rejected.

The telemetry path handles duplicate delivery, late data, missing streams, clock skew, reconnect/backlog and schema evolution. Simulation is limited to explicit tests and never appears as a physical claim.

## Current physical evidence

The FireBeetle 2 ESP32-S3 `commissioning-v2` foundation remains a historical terminal PASS: 17,796 of 17,796 records, zero drops/backlog, two of two software restart persistence checks and zero fault markers. The app does not reinterpret or rerun that commissioning record.

Physical sensors, probe wiring and real sensor telemetry remain **UNTESTED**. The product displays that boundary directly.

## Deployment and acceptance

Source, CI, deployment identity and runtime probes are separate evidence. A successful Vercel deployment does not establish ABEX trust integration, physical sensor validation or PRIME production admission.
