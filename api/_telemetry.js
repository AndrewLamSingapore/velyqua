const crypto = require('crypto');

const METRIC = /^[a-z][a-z0-9_]{1,47}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function parseTelemetry(body, now = new Date()) {
  const input = safeObject(body);
  const readingId = String(input.reading_id || '').trim();
  const sensorId = String(input.sensor_id || '').trim();
  const tankId = String(input.tank_id || '').trim();
  const metric = String(input.metric || '').trim();
  const sequence = Number(input.sequence);
  const rawValue = Number(input.raw_value ?? input.value);
  const normalizedValue = Number(input.normalized_value ?? input.value);
  const observed = new Date(String(input.observed_at || ''));
  if (!ID.test(readingId) || !ID.test(sensorId)) return { error: 'Stable reading_id and sensor_id are required.' };
  if (!tankId || tankId.length > 120 || !METRIC.test(metric)) return { error: 'Valid tank_id and metric are required.' };
  if (!Number.isSafeInteger(sequence) || sequence < 0) return { error: 'A non-negative integer sequence is required.' };
  if (!Number.isFinite(rawValue) || !Number.isFinite(normalizedValue)) return { error: 'Finite raw and normalized values are required.' };
  if (Number.isNaN(observed.getTime()) || observed.getTime() > now.getTime() + 5 * 60_000) return { error: 'observed_at is invalid or too far in the future.' };
  if (input.simulated === true) return { error: 'Simulated telemetry is not admitted by the production device endpoint.' };
  const ageMs = now.getTime() - observed.getTime();
  return {
    value: {
      readingId,
      sensorId,
      tankId,
      metric,
      sequence,
      rawValue,
      normalizedValue,
      observedAt: observed.toISOString(),
      unit: input.unit ? String(input.unit).slice(0, 32) : null,
      quality: ageMs > 30 * 60_000 ? 'SUSPECT' : 'GOOD',
      metadata: safeObject(input.metadata),
      firmwareVersion: input.firmware_version ? String(input.firmware_version).slice(0, 64) : null
    }
  };
}

function tokenHash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

module.exports = { parseTelemetry, tokenHash };
