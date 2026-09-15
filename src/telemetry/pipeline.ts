import { SensorQuality, TelemetryReading } from './types';

export type ReadingInput = Omit<TelemetryReading, 'quality' | 'receivedAt' | 'schemaVersion'> & {
  receivedAt?: string;
  schemaVersion?: '1.0.0';
};

export type IngestionResult =
  | { status: 'ACCEPTED' | 'LATE'; reading: TelemetryReading }
  | { status: 'DUPLICATE'; readingId: string }
  | { status: 'REJECTED'; reason: string };

export function classifyFreshness(observedAt: string, now = new Date()): SensorQuality {
  const age = now.getTime() - Date.parse(observedAt);
  if (!Number.isFinite(age) || age < -5 * 60_000) return 'INVALID';
  if (age > 30 * 60_000) return 'SUSPECT';
  return 'GOOD';
}

export function ingestReading(input: ReadingInput, seen: ReadonlySet<string>, now = new Date()): IngestionResult {
  if (seen.has(input.readingId)) return { status: 'DUPLICATE', readingId: input.readingId };
  if (!input.sensorId || !input.nodeId || !Number.isSafeInteger(input.sequence) || input.sequence < 0) {
    return { status: 'REJECTED', reason: 'Stable sensor, node and sequence identifiers are required.' };
  }
  if (!Number.isFinite(input.rawValue) || !Number.isFinite(input.normalizedValue)) {
    return { status: 'REJECTED', reason: 'Reading values must be finite.' };
  }
  const quality = input.simulated ? 'SIMULATED' : classifyFreshness(input.observedAt, now);
  if (quality === 'INVALID') return { status: 'REJECTED', reason: 'Reading timestamp is invalid or too far in the future.' };
  const reading: TelemetryReading = {
    ...input,
    schemaVersion: '1.0.0',
    receivedAt: input.receivedAt ?? now.toISOString(),
    quality
  };
  return { status: quality === 'SUSPECT' ? 'LATE' : 'ACCEPTED', reading };
}

export function missingSince(lastSeenAt: string | undefined, now = new Date(), thresholdMs = 5 * 60_000): boolean {
  return !lastSeenAt || now.getTime() - Date.parse(lastSeenAt) > thresholdMs;
}
