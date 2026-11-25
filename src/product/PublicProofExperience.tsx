import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SITE_URLS } from '../brand/urls';

const steps = [
  { label: '1 · Observe', title: 'Start with an observation', detail: 'A keeper notices fish spending more time near the surface. One observation alone does not establish a cause.', water: '7.2 mg/L', behaviour: '9% surface occupancy', action: 'Record a dated observation and check the context.' },
  { label: '2 · Compare', title: 'Look for a change, not a diagnosis', detail: 'In this fictional example, dissolved oxygen is lower and surface occupancy is higher. Both numbers are illustrative, not sensor readings.', water: '6.7 mg/L', behaviour: '26% surface occupancy', action: 'Verify the measurement, equipment and other possible explanations.' },
  { label: '3 · Respond', title: 'Document the keeper’s decision', detail: 'The keeper inspects aeration and records an intervention. VELYQUA does not autonomously adjust equipment or prescribe treatment.', water: 'Pending retest', behaviour: 'Pending follow-up', action: 'Log the care event and schedule a follow-up observation.' },
  { label: '4 · Learn', title: 'Check what happened afterward', detail: 'Follow-up evidence would be needed to understand the outcome. A coincident change is not proof of cause or improved welfare.', water: 'No follow-up supplied', behaviour: 'No outcome inferred', action: 'Compare observations over time; leave conclusions open until verified.' }
];

export function PublicProofExperience() {
  const [step, setStep] = useState(0);
  const current = steps[step] ?? steps[0]!;
  return <View style={styles.shell}>
    <View style={styles.brandBar}>
      <Text style={styles.brandName}>VELYQUA 维澜</Text>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(SITE_URLS.marketing)}><Text style={styles.brandLink}>Home ↗</Text></Pressable>
    </View>
    <View style={styles.heading}>
      <View style={styles.headingCopy}>
        <Text style={styles.eyebrow}>EXPLORE THE IDEA · INTERACTIVE WALKTHROUGH</Text>
        <Text style={styles.title}>From a water test to a more informed decision.</Text>
        <Text style={styles.body}>Follow one fictional aquarium-care scenario. See how environmental measurements, keeper observations and care history could fit together.</Text>
      </View>
      <View style={styles.badge}><Text style={styles.badgeText}>SYNTHETIC EXAMPLE</Text></View>
    </View>
    <View style={styles.steps}>{steps.map((item, index) => <Pressable key={item.label} onPress={() => setStep(index)} accessibilityRole="button" accessibilityState={{ selected: step === index }} style={[styles.step, step === index && styles.stepActive]}><Text style={[styles.stepText, step === index && styles.stepTextActive]}>{item.label}</Text></Pressable>)}</View>
    <View style={styles.scene}>
      <Text style={styles.sceneLabel}>SCENARIO {step + 1} OF {steps.length}</Text>
      <Text style={styles.sceneTitle}>{current.title}</Text>
      <Text style={styles.sceneBody}>{current.detail}</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={styles.metricLabel}>ILLUSTRATIVE DISSOLVED OXYGEN</Text><Text style={styles.metricValue}>{current.water}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>ILLUSTRATIVE BEHAVIOUR</Text><Text style={styles.metricValue}>{current.behaviour}</Text></View>
      </View>
      <View style={styles.action}><Text style={styles.actionLabel}>KEEPER-LED NEXT STEP</Text><Text style={styles.actionText}>{current.action}</Text></View>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: step === 0 }} disabled={step === 0} onPress={() => setStep(value => Math.max(0, value - 1))} style={[styles.button, step === 0 && styles.disabled]}><Text style={styles.buttonText}>Previous</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setStep(value => value === steps.length - 1 ? 0 : value + 1)} style={styles.next}><Text style={styles.nextText}>{step === steps.length - 1 ? 'Replay journey ↺' : 'Continue →'}</Text></Pressable>
      </View>
    </View>
    <View style={styles.boundary}><Text style={styles.boundaryTitle}>What is available today?</Text><Text style={styles.boundaryBody}>VELYQUA supports aquarium records, manual water tests, observations and care history. Camera-based behaviour analysis, individual-animal inference and automated intervention are not shipped capabilities. This walkthrough is educational and never writes fictional values into your aquarium records.</Text><Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://github.com/AndrewLamSingapore/velyqua/blob/main/docs/ANIMAL_ENVIRONMENT_INTELLIGENCE.md')}><Text style={styles.link}>Explore the evidence-gated research roadmap ↗</Text></Pressable><Pressable accessibilityRole="link" onPress={() => Linking.openURL(SITE_URLS.marketing)}><Text style={styles.link}>VELYQUA home ↗</Text></Pressable></View>
  </View>;
}

// Canonical VELYQUA brand tokens (shared with the marketing site):
// abyss #010A11, deep #041523, navy #062A4E, midnight #0B2748, teal #007F86,
// cyan #00BFC7, cyan-glow #4AF0E3, cyan-soft #8FE8E1, foam #F5FFFF,
// ink #EAF4F6, muted #7A96A8, line #12314B, amber #D79A24.
const styles = StyleSheet.create({
  shell: { backgroundColor: '#041523', borderRadius: 22, padding: 22, marginTop: 26, marginBottom: 12, borderWidth: 1, borderColor: '#12314B' },
  brandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brandName: { color: '#F5FFFF', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  brandLink: { color: '#4AF0E3', fontSize: 13, fontWeight: '800' },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, minWidth: 210 },
  eyebrow: { color: '#4AF0E3', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#F5FFFF', fontSize: 25, fontWeight: '900', lineHeight: 31, marginTop: 8 },
  body: { color: '#7A96A8', fontSize: 14, lineHeight: 21, marginTop: 8 },
  badge: { backgroundColor: '#12314B', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  badgeText: { color: '#D79A24', fontSize: 14, fontWeight: '900', letterSpacing: .5 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 20, marginBottom: 14 },
  step: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 11, backgroundColor: '#0B2748' },
  stepActive: { backgroundColor: '#4AF0E3' },
  stepText: { color: '#8FE8E1', fontWeight: '800', fontSize: 14 },
  stepTextActive: { color: '#010A11' },
  scene: { backgroundColor: '#061B2D', borderRadius: 17, padding: 20, borderWidth: 1, borderColor: '#12314B' },
  sceneLabel: { color: '#4AF0E3', fontSize: 14, fontWeight: '900', letterSpacing: 1.3 },
  sceneTitle: { color: '#F5FFFF', fontSize: 21, fontWeight: '900', marginTop: 8 },
  sceneBody: { color: '#7A96A8', fontSize: 14, lineHeight: 21, marginTop: 9 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  metric: { flex: 1, minWidth: 170, backgroundColor: '#062A4E', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#12314B' },
  metricLabel: { color: '#8FE8E1', fontSize: 14, fontWeight: '900', letterSpacing: .7 },
  metricValue: { color: '#F5FFFF', fontSize: 19, fontWeight: '900', marginTop: 8 },
  action: { backgroundColor: '#062A4E', padding: 14, borderRadius: 12, marginTop: 12 },
  actionLabel: { color: '#4AF0E3', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  actionText: { color: '#EAF4F6', fontSize: 14, fontWeight: '700', lineHeight: 21, marginTop: 5 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 18 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0B2748' },
  disabled: { opacity: .45 },
  buttonText: { color: '#F5FFFF', fontWeight: '800' },
  next: { backgroundColor: '#4AF0E3', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  nextText: { color: '#010A11', fontWeight: '900' },
  boundary: { paddingTop: 17 },
  boundaryTitle: { color: '#F5FFFF', fontSize: 15, fontWeight: '900' },
  boundaryBody: { color: '#7A96A8', fontSize: 14, lineHeight: 20, marginTop: 6 },
  link: { color: '#4AF0E3', fontSize: 14, fontWeight: '900', marginTop: 12 }
});
