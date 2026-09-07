import { createHash } from 'node:crypto';

/** Server/bench-only acquisition integrity. This does not qualify a water reading. */
export function payloadIdentity(bytes: Uint8Array) {
  return {
    payload_hash: createHash('sha256').update(bytes).digest('hex'),
    payload_byte_length: bytes.byteLength,
  };
}

export function modbusCrc16(bytes: Uint8Array): number {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc & 1) ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
  }
  return crc;
}

export type FrameResult =
  | { ok: true; registers: number[]; payload_hash: string; payload_byte_length: number }
  | { ok: false; reason: 'length' | 'crc' | 'address' | 'function' | 'exception' | 'byte_count'; payload_hash: string; payload_byte_length: number };

/** Decode a bounded 0x03/0x04 register response only after its exact bytes pass CRC. */
export function decodeRegisterFrame(input: Uint8Array, address: number, registerCount: number, functionCode = 3): FrameResult {
  if (!Number.isInteger(address) || address < 1 || address > 247 ||
      !Number.isInteger(registerCount) || registerCount < 1 || registerCount > 125 ||
      ![3, 4].includes(functionCode)) throw new Error('Invalid Modbus request context');
  const bytes = Uint8Array.from(input);
  const identity = payloadIdentity(bytes);
  const reject = (reason: Extract<FrameResult, { ok: false }>['reason']): FrameResult => ({ ok: false, reason, ...identity });
  if (bytes.length < 5 || bytes.length > 255) return reject('length');
  const crc = modbusCrc16(bytes.subarray(0, -2));
  if (crc !== (bytes[bytes.length - 2]! | bytes[bytes.length - 1]! << 8)) return reject('crc');
  if (bytes[0] !== address) return reject('address');
  if (bytes[1] === (functionCode | 0x80)) return reject(bytes.length === 5 ? 'exception' : 'length');
  if (bytes[1] !== functionCode) return reject('function');
  if (bytes[2] !== registerCount * 2 || bytes.length !== 5 + registerCount * 2) return reject('byte_count');
  const registers: number[] = [];
  for (let i = 3; i < bytes.length - 2; i += 2) registers.push((bytes[i]! << 8) | bytes[i + 1]!);
  return { ok: true, registers, ...identity };
}

export type AcquisitionAttempt = {
  correlation_id: string;
  attempt_id: string;
  source_id: string;
  payload_hash: string;
  payload_byte_length: number;
};

export function validateAttempt(attempt: AcquisitionAttempt, bytes: Uint8Array, previous: readonly AcquisitionAttempt[] = []): void {
  const id = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 128 && value.trim() === value;
  if (!id(attempt.correlation_id) || !id(attempt.attempt_id) || !id(attempt.source_id)) throw new Error('Invalid acquisition identity');
  const actual = payloadIdentity(bytes);
  if (attempt.payload_hash !== actual.payload_hash || attempt.payload_byte_length !== actual.payload_byte_length) throw new Error('Payload identity mismatch');
  if (previous.some(p => p.attempt_id === attempt.attempt_id)) throw new Error('Replayed attempt');
  if (previous.some(p => p.correlation_id !== attempt.correlation_id || p.source_id !== attempt.source_id)) throw new Error('Retry correlation mismatch');
}

/** Observation provenance must refer to the acquisition actually used to derive it. */
export function validateAcquisitionLink(observation: AcquisitionAttempt, acquisition: AcquisitionAttempt): void {
  for (const field of ['correlation_id', 'attempt_id', 'source_id', 'payload_hash', 'payload_byte_length'] as const) {
    if (observation[field] !== acquisition[field]) throw new Error(`Acquisition linkage mismatch: ${field}`);
  }
}
