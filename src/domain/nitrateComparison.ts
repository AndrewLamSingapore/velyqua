import type { Reading, SampleSource } from './types';

export function nitrateComparison(readings: Reading[]) {
  const samples: Partial<Record<SampleSource, Reading>> = {};
  for (const reading of readings) {
    const source = reading.sampleSource;
    if (!source || reading.parameter !== 'nitrate' || !Number.isFinite(Date.parse(reading.observedAt))) continue;
    const previous = samples[source];
    if (!previous || Date.parse(reading.observedAt) > Date.parse(previous.observedAt)) samples[source] = reading;
  }
  const { tank, tap } = samples;
  let summary = '';
  if (tank && tap) {
    if (tank.unit !== tap.unit) {
      summary = 'Use matching units to compare these measurements.';
    } else {
      const difference = tank.value - tap.value;
      summary = difference === 0 ? 'Both samples measured the same nitrate level.' :
        `Tank nitrate measured ${Number(Math.abs(difference).toPrecision(12))} ${tank.unit} ${difference < 0 ? 'lower' : 'higher'} than tap water.`;
    }
  }
  return { samples, summary };
}
