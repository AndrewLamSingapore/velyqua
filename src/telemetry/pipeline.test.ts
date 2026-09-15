import { describe, expect, it } from 'vitest';
import { ingestReading, missingSince } from './pipeline';

const reading = { readingId: 'r-1', sensorId: 's-1', nodeId: 'firebeetle-1', sequence: 1, observedAt: '2026-09-15T00:00:00Z', rawValue: 25, normalizedValue: 25, unit: '°C', simulated: false } as const;

describe('telemetry pipeline', () => {
  it('accepts a current physical reading', () => {
    const result = ingestReading(reading, new Set(), new Date('2026-09-15T00:01:00Z'));
    expect(result.status).toBe('ACCEPTED');
    if ('reading' in result) expect(result.reading.quality).toBe('GOOD');
  });
  it('identifies duplicate and late readings', () => {
    expect(ingestReading(reading, new Set(['r-1']), new Date()).status).toBe('DUPLICATE');
    expect(ingestReading(reading, new Set(), new Date('2026-09-15T01:00:00Z')).status).toBe('LATE');
  });
  it('marks fixtures as simulated and rejects future clocks', () => {
    const simulated = ingestReading({ ...reading, simulated: true }, new Set(), new Date('2026-09-15T00:01:00Z'));
    if ('reading' in simulated) expect(simulated.reading.quality).toBe('SIMULATED');
    expect(ingestReading({ ...reading, observedAt: '2026-09-15T00:10:01Z' }, new Set(), new Date('2026-09-15T00:00:00Z')).status).toBe('REJECTED');
  });
  it('detects a missing telemetry stream', () => {
    expect(missingSince(undefined)).toBe(true);
    expect(missingSince('2026-09-15T00:00:00Z', new Date('2026-09-15T00:06:00Z'))).toBe(true);
  });
});
