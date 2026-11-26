import { AquaState, Recommendation, Tank, WaterChangePreview, WaterParameter } from './types';

const latest = (tank: Tank, parameter: WaterParameter) =>
  tank.readings
    .filter((reading) => reading.parameter === parameter && reading.sampleSource !== 'tap')
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];

const ageHours = (iso: string) => (Date.now() - Date.parse(iso)) / 3_600_000;

const result = (state: AquaState, values: Omit<Recommendation, 'state'>): Recommendation => ({ state, ...values });

export function activeBreathingReports(tank: Tank) {
  const resolved = new Set(tank.activities.filter(item => item.type === 'breathing_resolved').map(item => item.relatedRecordId));
  return tank.activities.filter(item => item.type === 'breathing_observation' && item.breathing?.active && !resolved.has(item.id));
}

export function evaluateTank(tank: Tank): Recommendation {
  const report = activeBreathingReports(tank)[0];
  if (report?.breathing) {
    return result('needs_attention', {
      title: 'Check the affected fish now',
      reason: `You reported ${report.breathing.behavior} in ${report.breathing.subject} and marked it as ongoing.`,
      action: 'Check the fish and aeration now. Measure dissolved oxygen if you can.',
      confidence: 'partial', estimatedMinutes: 1, evidence: ['Keeper-reported breathing behavior'], showBreathingHistory: true
    });
  }
  const assessment = evaluateConfirmedEvidence(tank);
  const pending = (['nitrite', 'ammonia'] as const).flatMap(parameter => {
    const confirmed = latest(tank, parameter);
    const cutoff = confirmed ? Date.parse(confirmed.observedAt) : -Infinity;
    const uncertain = tank.activities.some(activity => activity.type === `uncertain_${parameter}` &&
      activity.sampleSource !== 'tap' && Date.parse(activity.occurredAt) > cutoff);
    if (!uncertain) return [];
    const detail = confirmed
      ? `Last confirmed ${parameter}: ${confirmed.value} ${confirmed.unit} · ${new Date(confirmed.observedAt).toLocaleString()}`
      : `No confirmed ${parameter} reading yet.`;
    return [{ parameter, detail }];
  });
  if (!pending.length) return assessment;
  const parameters = pending.map(item => item.parameter).join(' and ');
  const retestDetail = pending.map(item => item.detail).join('\n');
  if (assessment.state === 'needs_attention') {
    return { ...assessment, action: assessment.action + ` Retest needed for ${parameters}.`, retestDetail };
  }
  return result('more_information_needed', {
    title: 'Retest needed', reason: `Uncertain tank test: ${parameters}.`,
    action: `Repeat tank testing for ${parameters} and record the confirmed result.`,
    confidence: 'limited', estimatedMinutes: 5, evidence: pending.map(item => `Keeper-recorded uncertain ${item.parameter} test`), retestDetail
  });
}

function evaluateConfirmedEvidence(tank: Tank): Recommendation {
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

  // Use the latest update for each subject on each observation date.
  const trends = new Map<string, { date: string; worsening: boolean }>();
  for (const activity of [...tank.activities].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))) {
    const entry = activity.bodyCondition;
    if (activity.type !== 'body_condition' || !entry?.subject.trim()) continue;
    const key = entry.subject.trim().toLowerCase();
    const newer = trends.get(key);
    if (newer?.date === entry.date || newer?.worsening === false) continue;
    if (newer && entry.status === 'worsening') {
      return result('needs_attention', {
        title: 'Repeated worsening body condition',
        reason: `You recorded worsening body condition for ${entry.subject} on ${entry.date} and ${newer.date}.`,
        action: 'Review the dated observations for this fish or group.',
        confidence: 'partial', estimatedMinutes: 5, evidence: ['Keeper-recorded body condition'], showConditionHistory: true
      });
    }
    trends.set(key, { date: entry.date, worsening: entry.status === 'worsening' });
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
