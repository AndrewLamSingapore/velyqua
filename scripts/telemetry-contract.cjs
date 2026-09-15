const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTelemetry } = require('../api/_telemetry.js');

const now = new Date('2026-09-15T00:10:00Z');
const valid = { reading_id: 'reading-0001', sensor_id: 'sensor-temp-01', tank_id: 'velyqua-founding-tank', metric: 'temperature', sequence: 42, raw_value: 25.1, normalized_value: 25, unit: 'C', observed_at: '2026-09-15T00:09:00Z', simulated: false };

test('production telemetry requires stable replay identifiers', () => {
  assert.match(parseTelemetry({ ...valid, reading_id: '' }, now).error, /reading_id/);
  assert.equal(parseTelemetry(valid, now).value.quality, 'GOOD');
});
test('production telemetry rejects simulated, invalid and future readings', () => {
  assert.match(parseTelemetry({ ...valid, simulated: true }, now).error, /Simulated/);
  assert.match(parseTelemetry({ ...valid, normalized_value: Number.NaN }, now).error, /Finite/);
  assert.match(parseTelemetry({ ...valid, observed_at: '2026-09-15T00:16:00Z' }, now).error, /future/);
});
test('late telemetry is retained but labelled suspect', () => {
  assert.equal(parseTelemetry({ ...valid, observed_at: '2026-09-14T23:00:00Z' }, now).value.quality, 'SUSPECT');
});
