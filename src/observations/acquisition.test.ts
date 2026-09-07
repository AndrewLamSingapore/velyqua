import { describe, expect, it } from 'vitest';
import { decodeRegisterFrame, modbusCrc16, payloadIdentity, validateAttempt, validateAcquisitionLink } from './acquisition';

const frame = (data: number[]) => {
  const bytes = Uint8Array.from(data), crc = modbusCrc16(bytes);
  return Uint8Array.from([...bytes, crc & 255, crc >>> 8]);
};

describe('acquisition integrity', () => {
  it('matches independent SHA-256 and Modbus reference vectors', () => {
    expect(payloadIdentity(new TextEncoder().encode('abc'))).toEqual({ payload_hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', payload_byte_length: 3 });
    expect(modbusCrc16(new TextEncoder().encode('123456789'))).toBe(0x4b37);
    expect(modbusCrc16(Uint8Array.from([1, 3, 0, 0, 0, 10]))).toBe(0xcdc5);
  });
  it('hashes exact bytes, including UTF-8, whitespace and zero bytes', () => {
    expect(payloadIdentity(new TextEncoder().encode('水')).payload_byte_length).toBe(3);
    expect(payloadIdentity(Uint8Array.from([0])).payload_byte_length).toBe(1);
    expect(payloadIdentity(new TextEncoder().encode('abc\n')).payload_hash).not.toBe(payloadIdentity(new TextEncoder().encode('abc')).payload_hash);
  });
  it('parses big-endian registers only after a valid little-endian CRC', () => {
    expect(decodeRegisterFrame(frame([1, 3, 4, 0, 42, 1, 0]), 1, 2)).toMatchObject({ ok: true, registers: [42, 256] });
  });
  it('short-circuits CRC failure before address and parsing checks', () => {
    const corrupt = frame([1, 3, 2, 0, 42]); corrupt[0] = 2;
    const result = decodeRegisterFrame(corrupt, 1, 1);
    expect(result).toMatchObject({ ok: false, reason: 'crc' });
    expect(result).not.toHaveProperty('registers');
  });
  it('rejects mismatched request contexts, truncated and exception frames', () => {
    expect(decodeRegisterFrame(frame([2, 3, 2, 0, 42]), 1, 1)).toMatchObject({ reason: 'address' });
    expect(decodeRegisterFrame(frame([1, 4, 2, 0, 42]), 1, 1)).toMatchObject({ reason: 'function' });
    expect(decodeRegisterFrame(frame([1, 3, 2, 0, 42]), 1, 2)).toMatchObject({ reason: 'byte_count' });
    expect(decodeRegisterFrame(frame([1, 0x83, 2]), 1, 1)).toMatchObject({ reason: 'exception' });
    expect(decodeRegisterFrame(Uint8Array.from([1, 3]), 1, 1)).toMatchObject({ reason: 'length' });
    expect(() => decodeRegisterFrame(new Uint8Array(), 0, 1)).toThrow();
  });
  it('keeps correlation stable, changes attempt IDs and rejects replay or tampering', () => {
    const bytes = new TextEncoder().encode('abc');
    const first = { correlation_id: 'capture-1', attempt_id: 'attempt-1', source_id: 'bench-1', ...payloadIdentity(bytes) };
    validateAttempt(first, bytes);
    validateAttempt({ ...first, attempt_id: 'attempt-2' }, bytes, [first]);
    expect(() => validateAttempt(first, bytes, [first])).toThrow('Replayed');
    expect(() => validateAttempt({ ...first, attempt_id: 'attempt-2', correlation_id: 'changed' }, bytes, [first])).toThrow('correlation');
    expect(() => validateAttempt(first, new Uint8Array())).toThrow('Payload');
    validateAcquisitionLink(first, first);
    expect(() => validateAcquisitionLink({ ...first, attempt_id: 'other' }, first)).toThrow('linkage');
  });
});
