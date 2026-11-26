import { expect, it } from 'vitest';
import { nitrateComparison } from './nitrateComparison';
import type { Reading } from './types';

it('selects the latest dated nitrate per explicit source and excludes unlabeled results', () => {
  const base: Reading = { id: 'old', method: 'manual entry', parameter: 'nitrate', value: 80,
    unit: 'mg/L', observedAt: '2026-11-26T10:00:00Z' };
  expect(nitrateComparison([base]).samples).toEqual({});
  const tank: Reading = { ...base, id: 'tank', sampleSource: 'tank', value: 10 };
  const tap: Reading = { ...base, id: 'tap', sampleSource: 'tap', value: 30 };
  const old = { ...tank, value: 50, observedAt: '2026-11-25T10:00:00Z' };
  expect(nitrateComparison([tank, base, tap, old])).toEqual({
    samples: { tank, tap }, summary: 'Tank nitrate measured 20 mg/L lower than tap water.'
  });
  expect(nitrateComparison([tap]).summary).toBe('');
});
