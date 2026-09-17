# Optional export shape — draft specification

**Status: EXPORT SHAPE ONLY / NOT YET IMPLEMENTED / NOT ADOPTED.**

Date: 2026-09-17.
VELYQUA source basis: `4ecf65eec8dca0926fe01c3e9c34488e80764470`.
Canonical portfolio basis: PRIME `7ed7d9d60b44db9a1bc291cc0e709dc8ee60a65d`.
This branch document is a candidate, not a change to the Product Constitution or canonical operational state.

## Product boundary

VELYQUA is the independently functioning product. All external export consumers, assurance services and chain connections are optional and disconnected by default. In a diagram, dashed boxes denote that boundary; only the product itself is required.

VELYQUA must work without PRIME/JARVIS, a wallet, a blockchain or an assurance service. Its existing owner-controlled exports remain distinct from this proposed shape.

## Candidate field list

| Field | Intended meaning | Evidence limitation |
|---|---|---|
| `record_id` | Identifier for the exported record | Does not itself establish global uniqueness, subject identity or ownership |
| `payload_hash` | Digest identifying the precise payload being exported | Integrity comparison only; does not prove accurate capture or physical truth |
| `qualification_status` | Producer's declared qualification of this record for a stated purpose | Not an independent certification; interpretation requires a defined policy |
| `provenance_chain` | References describing the record's sources and transformations | A list of claims is not a verified history; references need supporting evidence |
| `declared_before_use_marker` | Candidate reference to evidence binding this record/declaration to a position before a specified use/action | A self-reported timestamp, flag or hash alone does not establish prior existence |

The final field name for the declaration marker is provisional. No timing mechanism is selected here.

## Declaration timing

The marker must be able to refer to independently checkable evidence of ordering: what exact payload/declaration was committed, and before which identified use or action. If that evidence is unavailable, prior declaration remains UNKNOWN. A missing marker must not be interpreted as proof that the declaration occurred late.

Matching a later-supplied declaration remains a consistency check; it does not prove prior authorization. Evidence of prior existence also does not by itself establish authorization.

## Reuse limits and deferred decisions

These generic names allow discussion of a common export shape without requiring a shared codebase. They do not establish interoperable implementations.

Types, schema versioning, identifier scope, hash algorithm and canonical payload encoding, qualification semantics, provenance verification, and timing-evidence verification remain unspecified. Consumers cannot safely infer these from field names. This is a field-level design note, not a complete wire contract.

Shared assurance remains candidate, not adopted. Formal VELYQUA conformance review remains gated on Gate 3 evidence: the first real CRC-valid Modbus frame. That gate does not suspend VELYQUA's existing manual-first product.

The Web3 Capability Service remains a parked design, untested by this work, with W3-01 restricted to testnet and zero real funds. No caller, chain connection or new capability is established here.

## Scope of this change

Documentation only: no code, integration, endpoint, database change, key, transaction, deployment or scheduled task. No existing execution hold is lifted. Saving this note proves only that the candidate text was recorded.
