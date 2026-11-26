import { describe, expect, it } from 'vitest';
import { evaluateTank, previewWaterChange } from './decisionEngine';
import { sampleTank } from './sample';
import { Reading, Tank } from './types';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const safeReadings: [Reading, Reading, Reading] = [
  { id: 'test-ammonia', parameter: 'ammonia', value: 0, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' },
  { id: 'test-nitrite', parameter: 'nitrite', value: 0, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' },
  { id: 'test-nitrate', parameter: 'nitrate', value: 30, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' }
];
const safeTank: Tank = { ...sampleTank, sourceWaterNitrate: 5, readings: safeReadings };

describe('VELYQUA decision engine', () => {
  it('keeps legacy tank warnings independent of confirmed and uncertain tap tests', () => {
    const positive = { ...safeReadings[1], value: 0.37 };
    const tap = { ...safeReadings[1], observedAt: hoursAgo(0.5), sampleSource: 'tap' as const };
    const tank = { ...safeTank, readings: [positive, tap, safeReadings[0], safeReadings[2]] };
    expect(evaluateTank(tank).state).toBe('needs_attention');
    const confirmed = { ...tap, observedAt: hoursAgo(0.2), sampleSource: 'tank' as const };
    expect(evaluateTank({ ...tank, readings: [confirmed, ...tank.readings], activities: [
      { id: 'tap', type: 'uncertain_nitrite', occurredAt: hoursAgo(0.1), sampleSource: 'tap' }
    ] }).state).toBe('all_clear');
  });

  it('compares consecutive dated body condition entries within each fish or group', () => {
    function observation(date: string, subject: string, status: 'worsening' | 'improving' = 'worsening'): Tank['activities'][number] {
      return { id: date + subject, type: 'body_condition', occurredAt: date + 'T12:00:00Z', bodyCondition: { subject, status, date } };
    }
    const first = observation('2026-11-01', 'Guppy A');
    const second = observation('2026-11-02', 'guppy a');
    const tank = { ...safeTank, activities: [first, second] };
    expect(evaluateTank(tank)).toMatchObject({ state: 'needs_attention', showConditionHistory: true });
    expect(evaluateTank({ ...tank, activities: [first, observation('2026-11-02', 'Guppy B')] }).state).toBe('all_clear');
    expect(evaluateTank({ ...tank, activities: [first, first] }).state).toBe('all_clear');
    expect(evaluateTank({ ...tank, activities: [...tank.activities, observation('2026-11-03', 'Guppy A', 'improving')] }).state).toBe('all_clear');
    expect(evaluateTank({ ...tank, readings: [{ ...safeReadings[1], value: 0.37 }] }).reason).toContain('Nitrite');
  });

  it('keeps an uncertain nitrite result pending until a newer confirmed reading', () => {
    const activities: Tank['activities'] = [{ id: 'uncertain', type: 'uncertain_nitrite', occurredAt: hoursAgo(0.5) }];
    const tank = { ...safeTank, activities };
    expect(evaluateTank(tank)).toMatchObject({ title: 'Retest needed', nitriteRetest: expect.stringContaining('0 mg/L') });
    expect(evaluateTank({ ...tank, readings: [] }).title).toBe('Retest needed');
    const positive = { ...safeReadings[1], value: 0.37 };
    expect(evaluateTank({ ...tank, readings: [positive] })).toMatchObject({
      state: 'needs_attention', action: expect.stringContaining('Retest needed'), nitriteRetest: expect.stringContaining('0.37')
    });
    const confirmed = { ...safeReadings[1], observedAt: hoursAgo(0.1) };
    expect(evaluateTank({ ...tank, readings: [confirmed, ...safeReadings] })).toMatchObject({ state: 'all_clear' });
  });

  it('surfaces repeated losses with otherwise clear water and preserves water-hazard priority', () => {
    const activities: Tank['activities'] = [24, 48].map(hours => ({
      id: String(hours), type: 'livestock_loss', occurredAt: hoursAgo(hours)
    }));
    const tank = { ...safeTank, activities };
    expect(evaluateTank(tank)).toMatchObject({ state: 'needs_attention', showLossHistory: true });
    expect(evaluateTank({ ...tank, readings: [] }).showLossHistory).toBe(true);
    expect(evaluateTank({ ...tank, readings: [{ ...safeReadings[1], value: 0.37 }] }).reason).toContain('Nitrite');
    expect(evaluateTank({ ...tank, activities: activities.map(a => ({ ...a, type: 'observation' })) }).state).toBe('all_clear');
    expect(evaluateTank({ ...tank, activities: activities.map(a => ({ ...a, occurredAt: hoursAgo(24) })) }).state).toBe('all_clear');
    expect(evaluateTank({ ...tank, activities: activities.map(a => ({ ...a, occurredAt: hoursAgo(800) })) }).state).toBe('all_clear');
  });

  it('flags fresh positive nitrite before requesting missing tests', () => {
    const reading = { ...safeReadings[1], value: 0.37 };
    const recommendation = evaluateTank({ ...safeTank, readings: [reading] });
    expect(recommendation.state).toBe('needs_attention');
    expect(recommendation.reason).toContain('Nitrite');
    expect(recommendation.action).toContain('fresh tests for ammonia and nitrate');
  });

  it('requests a fresh nitrite test when the only reading is stale', () => {
    const reading = { ...safeReadings[1], value: 0.37, observedAt: hoursAgo(169) };
    const recommendation = evaluateTank({ ...safeTank, readings: [reading] });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.action).toMatch(/fresh tests.*nitrite/);
  });

  it('returns all clear for a complete safe test fixture', () => {
    expect(evaluateTank(safeTank).state).toBe('all_clear');
  });

  it('asks the Founding Tank for real tests instead of inventing safety', () => {
    expect(evaluateTank(sampleTank).state).toBe('more_information_needed');
  });

  it('prioritizes confirmed ammonia', () => {
    const readings = safeReadings.map((r) => r.parameter === 'ammonia' ? { ...r, value: 0.25 } : r);
    expect(evaluateTank({ ...safeTank, readings }).state).toBe('needs_attention');
  });

  it('calculates a transparent water-change estimate', () => {
    expect(previewWaterChange(safeTank, 25)?.estimatedNitrate).toBe(23.8);
  });
});
