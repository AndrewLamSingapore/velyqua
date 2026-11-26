import { AquaState, Recommendation, Tank, WaterChangePreview, WaterParameter } from './types';

const latest = (tank: Tank, parameter: WaterParameter) =>
  tank.readings
    .filter((reading) => reading.parameter === parameter)
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];

const ageHours = (iso: string) => (Date.now() - Date.parse(iso)) / 3_600_000;

const result = (state: AquaState, values: Omit<Recommendation, 'state'>): Recommendation => ({ state, ...values });

export function evaluateTank(tank: Tank): Recommendation {
  const ammonia = latest(tank, 'ammonia');
  const nitrite = latest(tank, 'nitrite');
  const nitrate = latest(tank, 'nitrate');
  const nitrogen = { ammonia, nitrite, nitrate };
  const fresh = (reading: typeof nitrite) => {
    const age = reading ? ageHours(reading.observedAt) : NaN;
    return age >= 0 && age <= 168;
  };
  const concern = [ammonia, nitrite].find(reading => reading && reading.value > 0 && fresh(reading));
  const pending = Object.entries(nitrogen).filter(([, reading]) => !fresh(reading)).map(([name]) => name);

  if (concern) {
    return result('needs_attention', {
      title: 'Confirmed reading needs attention',
      action: 'Verify the result now and prepare a conservative partial water change.' +
        (pending.length ? ` Follow up with fresh tests for ${pending.join(' and ')}.` : ''),
      reason: `${concern.parameter === 'ammonia' ? 'Ammonia' : 'Nitrite'} is above zero in a confirmed recent test.`,
      confidence: 'strong', estimatedMinutes: 10,
      evidence: ['Fresh confirmed owner reading', 'Rule OA-FW-URG-001']
    });
  }

  const lossDays = new Set(tank.activities
    .filter(activity => activity.type === 'livestock_loss' && ageHours(activity.occurredAt) >= 0 && ageHours(activity.occurredAt) <= 30 * 24)
    .map(activity => new Date(activity.occurredAt).toDateString()));
  if (lossDays.size >= 2) {
    return result('needs_attention', {
      title: 'Repeated livestock losses need attention',
      reason: 'You recorded livestock losses on separate dates in the past 30 days.',
      action: 'Review the dated observations and check the remaining livestock.',
      confidence: 'partial', estimatedMinutes: 5,
      evidence: ['Keeper-recorded livestock losses'], showLossHistory: true
    });
  }

  if (!ammonia || !nitrite || !nitrate) {
    return result('more_information_needed', {
      title: 'One water test will make this clearer',
      action: `Record fresh tests for ${pending.join(', ')}`,
      reason: 'VELYQUA will not claim the tank is clear while a decision-critical reading is missing.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Missing nitrogen-cycle reading']
    });
  }

  if (pending.length) {
    return result('more_information_needed', {
      title: 'Your water picture is out of date',
      action: 'Run a fresh water test',
      reason: 'A decision-critical reading needs a current test date.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Freshness rule OA-FW-001']
    });
  }

  if (nitrate.value >= 40) {
    return result('needs_attention', {
      title: 'Nitrate is worth reducing',
      action: 'Preview a modest water change',
      reason: `The latest nitrate reading is ${nitrate.value} mg/L. VELYQUA recommends comparing small changes before acting.`,
      confidence: 'strong', estimatedMinutes: 5,
      evidence: ['Latest nitrate reading', 'Rule OA-FW-NO3-001']
    });
  }

  return result('all_clear', {
    title: 'Nothing urgent stands out',
    action: 'No action needed now',
    reason: 'Recent ammonia and nitrite are zero, and nitrate is below the current attention threshold.',
    confidence: 'strong', estimatedMinutes: 0,
    evidence: ['Recent confirmed water test', 'Rule set 0.1.0']
  });
}

export function previewWaterChange(tank: Tank, percentage: number): WaterChangePreview | null {
  const nitrate = latest(tank, 'nitrate');
  if (!nitrate || tank.sourceWaterNitrate === undefined) return null;
  const fraction = percentage / 100;
  return {
    percentage,
    currentNitrate: nitrate.value,
    sourceNitrate: tank.sourceWaterNitrate,
    estimatedNitrate: Number((nitrate.value * (1 - fraction) + tank.sourceWaterNitrate * fraction).toFixed(1)),
    limitation: 'Arithmetic estimate only. It does not predict biological change, mixing error or future waste production.'
  };
}
