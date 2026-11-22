import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.boundary}><Text style={styles.boundaryTitle}>What is available today?</Text><Text style={styles.boundaryBody}>VELYQUA supports aquarium records, manual water tests, observations and care history. Camera-based behaviour analysis, individual-animal inference and automated intervention are not shipped capabilities. This walkthrough is educational and never writes fictional values into your aquarium records.</Text><Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://github.com/AndrewLamSingapore/velyqua/blob/main/docs/ANIMAL_ENVIRONMENT_INTELLIGENCE.md')}><Text style={styles.link}>Explore the evidence-gated research roadmap ↗</Text></Pressable></View>
  </View>;
}
const ink = '#102f36';
const styles = StyleSheet.create({
  shell: { backgroundColor: '#eaf5f1', borderRadius: 22, padding: 22, marginTop: 26, marginBottom: 12, borderWidth: 1, borderColor: '#cce5dc' },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, minWidth: 210 },
  eyebrow: { color: '#16766b', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: ink, fontSize: 25, fontWeight: '900', lineHeight: 31, marginTop: 8 },
  body: { color: '#476569', fontSize: 14, lineHeight: 21, marginTop: 8 },
  badge: { backgroundColor: '#fff3d7', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  badgeText: { color: '#79530c', fontSize: 14, fontWeight: '900', letterSpacing: .5 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 20, marginBottom: 14 },
  step: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 11, backgroundColor: '#d9eae5' },
  stepActive: { backgroundColor: ink },
  stepText: { color: '#426a68', fontWeight: '800', fontSize: 14 },
  stepTextActive: { color: '#fff' },
  scene: { backgroundColor: '#fff', borderRadius: 17, padding: 20 },
  sceneLabel: { color: '#16766b', fontSize: 14, fontWeight: '900', letterSpacing: 1.3 },
  sceneTitle: { color: ink, fontSize: 21, fontWeight: '900', marginTop: 8 },
  sceneBody: { color: '#536d70', fontSize: 14, lineHeight: 21, marginTop: 9 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  metric: { flex: 1, minWidth: 170, backgroundColor: '#f0f7f4', borderRadius: 12, padding: 14 },
  metricLabel: { color: '#567471', fontSize: 14, fontWeight: '900', letterSpacing: .7 },
  metricValue: { color: ink, fontSize: 19, fontWeight: '900', marginTop: 8 },
  action: { backgroundColor: '#e7f1ee', padding: 14, borderRadius: 12, marginTop: 12 },
  actionLabel: { color: '#14766c', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  actionText: { color: ink, fontSize: 14, fontWeight: '700', lineHeight: 21, marginTop: 5 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 18 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e7efec' },
  disabled: { opacity: .45 },
  buttonText: { color: ink, fontWeight: '800' },
  next: { backgroundColor: '#147c78', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  nextText: { color: 'white', fontWeight: '900' },
  boundary: { paddingTop: 17 },
  boundaryTitle: { color: ink, fontSize: 15, fontWeight: '900' },
  boundaryBody: { color: '#526e70', fontSize: 14, lineHeight: 20, marginTop: 6 },
  link: { color: '#126d68', fontSize: 14, fontWeight: '900', marginTop: 12 }
});
