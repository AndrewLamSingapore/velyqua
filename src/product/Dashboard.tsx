import { sampleSourceLabel } from '../domain/types';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { evaluateTank } from '../domain/decisionEngine';
import { Tank } from '../domain/types';
import { CreatorConnection } from './CreatorConnection';
import { PublicProofExperience } from './PublicProofExperience';
import { SITE_URLS } from '../brand/urls';

type Screen = 'home' | 'live' | 'history' | 'alerts' | 'people' | 'system';

const screens: Array<{ id: Screen; label: string; glyph: string }> = [
  { id: 'home', label: 'Home', glyph: '⌂' },
  { id: 'live', label: 'Sensors', glyph: '◉' },
  { id: 'history', label: 'History', glyph: '⌁' },
  { id: 'alerts', label: 'Alerts', glyph: '◇' },
  { id: 'people', label: 'People', glyph: '♙' },
  { id: 'system', label: 'System', glyph: '⚙' }
];

const commissionedNode = {
  nodeId: 'firebeetle2-esp32s3-01',
  displayName: 'Living Water Node',
  hardware: 'FireBeetle 2 ESP32-S3',
  firmware: 'commissioning-v2',
  evidence: 'Terminal commissioning passed · 17,796 / 17,796 records · zero drops'
};

function ageLabel(value?: string) {
  if (!value) return 'No physical reading yet';
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

function Panel({ children, tone = 'plain' }: React.PropsWithChildren<{ tone?: 'plain' | 'aqua' | 'dark' | 'amber' }>) {
  return <View style={[styles.panel, tone === 'aqua' && styles.panelAqua, tone === 'dark' && styles.panelDark, tone === 'amber' && styles.panelAmber]}>{children}</View>;
}

function Pill({ children, tone = 'neutral' }: React.PropsWithChildren<{ tone?: 'good' | 'warn' | 'neutral' | 'offline' }>) {
  return <View style={[styles.pill, tone === 'good' && styles.pillGood, tone === 'warn' && styles.pillWarn, tone === 'offline' && styles.pillOffline]}><Text style={styles.pillText}>{children}</Text></View>;
}

function Metric({ label, value, note, muted }: { label: string; value: string; note: string; muted?: boolean }) {
  return <View style={[styles.metric, muted && styles.metricMuted]}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricNote}>{note}</Text></View>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <View style={styles.empty}><Text style={styles.emptyGlyph}>○</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>;
}

function Home({ tank, onQuickUpdate, publicAccess, onHistory }: { onHistory: () => void; tank: Tank; onQuickUpdate: () => void; publicAccess: boolean }) {
  const recommendation = useMemo(() => evaluateTank(tank), [tank]);
  const latest = tank.readings.filter(item => item.sampleSource !== 'tap').sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];
  const state = recommendation.state;
  const showRecommendation = tank.readings.length > 0 || recommendation.showLossHistory || recommendation.showConditionHistory || recommendation.nitriteRetest;
  return <>
    <View style={styles.heroRow}>
      <View style={styles.heroCopy}><Text style={styles.kicker}>INTELLIGENCE FOR LIVING WATER</Text><Text accessibilityRole="header" style={styles.hero}>Understand your water. Remember every change.</Text><Text style={styles.subhero}>Water tests, keeper observations and care history in one place. Start with what you can observe, then follow what changes over time.</Text></View>
    </View>
    <Panel tone="dark">
      <View style={styles.between}><View style={styles.grow}><Text style={styles.darkKicker}>RIGHT NOW</Text><Text style={styles.darkTitle}>{showRecommendation ? recommendation.title : 'Start with a water test or observation'}</Text><Text style={styles.darkBody}>{showRecommendation ? recommendation.reason : 'Record a manual test, note what you see and build a useful history. Missing measurements remain visible.'}</Text></View><Pill tone={state === 'all_clear' ? 'good' : 'warn'}>{state === 'all_clear' ? 'ALL CLEAR' : state === 'needs_attention' ? 'NEEDS ATTENTION' : 'MORE INFORMATION'}</Pill></View>
      <View style={styles.dividerDark} />
      <Text style={styles.darkAction}>{showRecommendation ? recommendation.action : 'Add a manual water test or record a care action.'}</Text>
      {recommendation.nitriteRetest && <Text style={styles.darkBody}>{recommendation.nitriteRetest}</Text>}
      {recommendation.showConditionHistory && <Pressable accessibilityRole="button" onPress={onHistory} style={styles.lightButton}><Text style={styles.lightButtonText}>View body condition history</Text></Pressable>}
      {recommendation.showLossHistory && <Pressable accessibilityRole="button" onPress={onHistory} style={styles.lightButton}><Text style={styles.lightButtonText}>View loss history</Text></Pressable>}
      <Pressable accessibilityRole="button" style={styles.lightButton} onPress={onQuickUpdate}><Text style={styles.lightButtonText}>Record an observation</Text></Pressable>
    </Panel>
    {publicAccess && <PublicProofExperience />}
    <Text style={styles.sectionTitle}>At a glance</Text>
    <View style={styles.metricGrid}>
      <Metric label="WATER" value={latest ? `${latest.value} ${latest.unit}` : '—'} note={latest ? `${latest.parameter} · ${ageLabel(latest.observedAt)}` : 'No physical readings'} muted={!latest} />
      <Metric label="WATER TESTS" value={String(tank.readings.length)} note="Your recorded measurements" />
      <Metric label="CARE HISTORY" value={String(tank.activities.length)} note="Actions and observations" />
      <Metric label="SENSOR ALERTS" value="Not assessed" note="No admitted physical telemetry" muted />
    </View>
    <Text style={styles.sectionTitle}>Aquarium</Text>
    <Panel tone="aqua"><View style={styles.between}><View><Text style={styles.panelTitle}>{tank.name}</Text><Text style={styles.panelBody}>Planted freshwater community · Singapore</Text></View><Text style={styles.volume}>~{tank.volumeLitres} L</Text></View><View style={styles.factRow}><Text style={styles.fact}>{tank.livestock?.filter(x => x.status === 'active').length ?? 0} livestock groups</Text><Text style={styles.fact}>{tank.activities.length} care events</Text><Text style={styles.fact}>{tank.readings.length} readings</Text></View></Panel>
    <Text style={styles.sectionTitle}>Today</Text>
    <Panel><Text style={styles.panelTitle}>{recommendation.title}</Text><Text style={styles.panelBody}>{recommendation.reason}</Text><Text style={styles.quiet}>VELYQUA does not reward unnecessary intervention.</Text></Panel>
  </>;
}

function Live({ tank }: { tank: Tank }) {
  const readings = tank.readings.filter(item => item.sampleSource !== 'tap').sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  return <>
    <Text style={styles.kicker}>LIVE WATER</Text><Text accessibilityRole="header" style={styles.hero}>Physical readings, with their age and quality.</Text><Text style={styles.subhero}>Stale, missing and simulated values are always labelled.</Text>
    <Panel tone="amber"><View style={styles.between}><View style={styles.grow}><Text style={styles.panelTitle}>Sensors have not been physically commissioned</Text><Text style={styles.panelBody}>The ESP32-S3 foundation passed commissioning. The physical probes and their readings remain untested.</Text></View><Pill tone="warn">AWAITING SENSORS</Pill></View></Panel>
    <View style={styles.sensorGrid}>
      {['Temperature', 'pH', 'Ammonia', 'Nitrite', 'Nitrate', 'Dissolved oxygen'].map((label) => {
        const key = label.toLowerCase().replace(' ', '_');
        const reading = readings.find(item => item.parameter === key);
        return <Metric key={label} label={label.toUpperCase()} value={reading ? `${reading.value} ${reading.unit}` : '—'} note={reading ? `Manual · ${ageLabel(reading.observedAt)}` : 'No physical reading'} muted={!reading} />;
      })}
    </View>
    <Text style={styles.sectionTitle}>Telemetry path</Text>
    <Panel><View style={styles.path}><Text style={styles.pathNode}>SENSOR</Text><Text style={styles.arrow}>→</Text><Text style={styles.pathNode}>ESP32</Text><Text style={styles.arrow}>→</Text><Text style={styles.pathNode}>VELYQUA</Text><Text style={styles.arrow}>→</Text><Text style={styles.pathNode}>HISTORY</Text></View><Text style={styles.panelBody}>Duplicate, late, missing, invalid and reconnecting streams are handled by the versioned telemetry contract.</Text></Panel>
  </>;
}

type ResolveMissing = (id: string, outcome: 'fish_found' | 'livestock_loss') => Promise<void>;

function History({ tank, onResolveMissing }: { tank: Tank; onResolveMissing: ResolveMissing }) {
  const [error, setError] = useState('');
  const resolved = new Set(tank.activities.filter(item => item.type === 'fish_found' || item.type === 'livestock_loss').map(item => item.relatedRecordId));
  const openCases = tank.activities.filter(item => item.type === 'fish_missing' && !resolved.has(item.id));
  const resolve = async (id: string, outcome: 'fish_found' | 'livestock_loss') => {
    try { setError(''); await onResolveMissing(id, outcome); }
    catch { setError('Could not save the outcome. Please try again.'); }
  };
  const readings = [...tank.readings].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  return <><Text style={styles.kicker}>HISTORY</Text><Text accessibilityRole="header" style={styles.hero}>A record you can trust.</Text><Text style={styles.subhero}>Only owner observations and admitted physical telemetry belong here.</Text>
    {openCases.map(item => <Panel key={item.id}>
      <Text style={styles.panelTitle}>Missing: {item.missingFishName}</Text>
      <Text style={styles.panelBody}>{new Date(item.occurredAt).toLocaleDateString()} · {item.note}</Text>
      {(['fish_found', 'livestock_loss'] as const).map(outcome => {
        const label = outcome === 'fish_found' ? 'Mark found' : 'Confirm loss';
        return <Pressable key={outcome} accessibilityRole="button" accessibilityLabel={label + ' for ' + item.missingFishName}
          onPress={() => resolve(item.id, outcome)} style={styles.lightButton}><Text style={styles.lightButtonText}>{label}</Text></Pressable>;
      })}
    </Panel>)}
    {error ? <Text>{error}</Text> : null}
    <Text style={styles.panelBody}>All recorded water tests, newest first.</Text>
    {readings.length === 0 ? <Empty title="No water history yet" body="Connect a physical sensor or record a manual test. VELYQUA will never fill this chart with made-up readings." /> : readings.map(item => <Panel key={item.id}><View style={styles.between}><View><Text style={styles.panelTitle}>{item.parameter.replaceAll('_', ' ')}</Text><Text style={styles.panelBody}>{new Date(item.observedAt).toLocaleString()} · {item.method} · {sampleSourceLabel(item.sampleSource)}</Text></View><Text style={styles.historyValue}>{item.value} {item.unit}</Text></View></Panel>)}
    <Text style={styles.sectionTitle}>Care timeline</Text>{[...tank.activities].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).map(item => <View key={item.id} style={styles.timeline}><View style={styles.timelineDot} /><View style={styles.grow}><Text style={styles.timelineTitle}>{item.type.replaceAll('_', ' ')}</Text><Text style={styles.timelineBody}>{item.missingFishName ? item.missingFishName + ' · ' : ''}{item.bodyCondition ? `${item.bodyCondition.subject} · ${item.bodyCondition.status} · ${item.bodyCondition.date}` : ''}{item.bodyCondition ? ' · ' : ''}{item.note ?? 'No note'}{item.type === 'uncertain_nitrite' ? ' · ' + sampleSourceLabel(item.sampleSource) : ''} · {new Date(item.occurredAt).toLocaleDateString()}</Text></View></View>)}
  </>;
}

function Alerts() {
  return <><Text style={styles.kicker}>ALERTS & EVENTS</Text><Text accessibilityRole="header" style={styles.hero}>Attention when it matters.</Text><Text style={styles.subhero}>INFO, WARNING, CRITICAL and RECOVERY events keep their source and evidence.</Text><Panel tone="aqua"><View style={styles.between}><View><Text style={styles.panelTitle}>Sensor thresholds are not assessed</Text><Text style={styles.panelBody}>There is not enough physical telemetry to assess aquarium thresholds.</Text></View><Pill tone="neutral">NOT ASSESSED</Pill></View></Panel><Empty title="No event history" body="Connectivity, sensor health and threshold events will appear here after the physical telemetry path is admitted." /></>;
}

function People() {
  return <><Text style={styles.kicker}>TRUSTED PEOPLE & DEVICES</Text><Text accessibilityRole="header" style={styles.hero}>Invite once. Stay connected securely.</Text><Text style={styles.subhero}>Sharing access is a planned integration. Your aquarium records keep their existing account boundaries.</Text>
    <Panel tone="amber"><View style={styles.between}><View style={styles.grow}><Text style={styles.panelTitle}>ORQEVIA enrollment integration pending</Text><Text style={styles.panelBody}>Invitations are not available in this release. Account and aquarium data remain under the existing access controls.</Text></View><Pill tone="warn">FAIL CLOSED</Pill></View></Panel>
    <Text style={styles.sectionTitle}>Expected invitation journey</Text><Panel><View style={styles.step}><Text style={styles.stepNumber}>1</Text><View><Text style={styles.stepTitle}>Owner chooses access</Text><Text style={styles.panelBody}>Aquarium, telemetry and care permissions are application-scoped.</Text></View></View><View style={styles.step}><Text style={styles.stepNumber}>2</Text><View><Text style={styles.stepTitle}>One secure invitation</Text><Text style={styles.panelBody}>QR or link has an explicit ACTIVE, USED, EXPIRED or REVOKED state.</Text></View></View><View style={styles.step}><Text style={styles.stepNumber}>3</Text><View><Text style={styles.stepTitle}>Device enrolls once</Text><Text style={styles.panelBody}>The device refreshes sessions without storing a permanent bearer token.</Text></View></View></Panel>
    <Pressable accessibilityState={{ disabled: true }} style={styles.disabledButton}><Text style={styles.disabledText}>Invite person · integration pending</Text></Pressable>
  </>;
}

function System({ syncLabel }: { syncLabel: string }) {
  return <><Text style={styles.kicker}>SYSTEM</Text><Text accessibilityRole="header" style={styles.hero}>Health without the engineering noise.</Text><Text style={styles.subhero}>Open diagnostics only when you need the evidence.</Text>
    <Panel><View style={styles.between}><View style={styles.grow}><Text style={styles.panelTitle}>{commissionedNode.displayName}</Text><Text style={styles.panelBody}>{commissionedNode.hardware}</Text></View><Pill tone="warn">LINK PENDING</Pill></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Stable identity</Text><Text style={styles.infoValue}>{commissionedNode.nodeId}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Firmware</Text><Text style={styles.infoValue}>{commissionedNode.firmware}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Dated terminal reference test</Text><Text style={styles.infoValue}>Recorded</Text></View><Text style={styles.evidence}>{commissionedNode.evidence}</Text></Panel>
    <Text style={styles.sectionTitle}>Connections</Text><Panel><View style={styles.infoRow}><Text style={styles.infoLabel}>Aquarium record</Text><Text style={styles.infoValue}>{syncLabel}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>ESP32 application link</Text><Text style={styles.infoValue}>Not observed</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Physical sensors</Text><Text style={styles.infoValue}>Untested</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>ORQEVIA trust</Text><Text style={styles.infoValue}>Adapter ready</Text></View></Panel>
    <Text style={styles.sectionTitle}>Product boundary</Text><Panel><Text style={styles.panelBody}>VELYQUA owns aquarium observations. ORQEVIA is a separate authenticated workspace. Public navigation does not transfer aquarium data or grant access to either system.</Text></Panel>
  </>;
}

export function ProductDashboard({ tank, syncLabel, publicAccess, onQuickUpdate, onAccount, onResolveMissing }: { tank: Tank; syncLabel: string; publicAccess: boolean; onResolveMissing: ResolveMissing; onQuickUpdate: () => void; onAccount: () => void }) {
  const [screen, setScreen] = useState<Screen>('home');
  const { width } = useWindowDimensions();
  const desktop = width >= 880;
  const content = screen === 'home' ? <Home onHistory={() => setScreen('history')} tank={tank} onQuickUpdate={onQuickUpdate} publicAccess={publicAccess} /> : screen === 'live' ? <Live tank={tank} /> : screen === 'history' ? <History tank={tank} onResolveMissing={onResolveMissing} /> : screen === 'alerts' ? <Alerts /> : screen === 'people' ? <People /> : <System syncLabel={syncLabel} />;
  return <View style={[styles.shell, desktop && styles.shellDesktop]}>
    <View style={[styles.sidebar, !desktop && styles.sidebarMobile]}>
      <View style={styles.brandBlock}><View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>{desktop && <View><Text style={styles.brand}>VELYQUA</Text><Text style={styles.brandLine}>LIVING WATER</Text></View>}</View>
      <View style={[styles.navigation, !desktop && styles.navigationMobile]}>{screens.filter(item => !publicAccess || item.id !== 'people').map(item => <Pressable key={item.id} onPress={() => setScreen(item.id)} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: screen === item.id }} style={[styles.navItem, !desktop && styles.navItemMobile, screen === item.id && styles.navActive]}><Text style={styles.navGlyph}>{item.glyph}</Text>{desktop && <Text style={[styles.navLabel, screen === item.id && styles.navLabelActive]}>{item.label}</Text>}</Pressable>)}</View>
      {desktop && <View style={styles.sidebarFoot}><View style={styles.statusDot} /><Text style={styles.sidebarStatus}>{publicAccess ? 'GUEST DEVICE' : 'PRIVATE CLOUD'}</Text></View>}
    </View>
    <View style={styles.main}>
      <View style={styles.topbar}><View><Text style={styles.topTank}>{tank.name}</Text><Text style={styles.topStatus}>{syncLabel}</Text></View><View style={styles.topActions}><Pressable accessibilityRole="link" onPress={() => Linking.openURL(SITE_URLS.marketing)}><Text style={styles.homeLink}>VELYQUA home ↗</Text></Pressable>{publicAccess ? <Text style={styles.guestBadge}>Guest · this device</Text> : <Pressable onPress={onAccount} accessibilityRole="button" accessibilityLabel="Account settings" style={styles.avatar}><Text style={styles.avatarText}>A</Text></Pressable>}</View></View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>{content}{screen === 'home' && <CreatorConnection />}<Text style={styles.footer}>VELYQUA · Intelligence for Living Water · Evidence before intervention</Text></ScrollView>
      <Pressable onPress={onQuickUpdate} accessibilityRole="button" accessibilityLabel="Add observation" style={styles.fab}><Text style={styles.fabText}>＋</Text></Pressable>
    </View>
  </View>;
}

const ink = '#F5FFFF';
const teal = '#4AF0E3';
const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#010A11' }, shellDesktop: { flexDirection: 'row' },
  sidebar: { width: 216, backgroundColor: '#092f37', paddingHorizontal: 18, paddingVertical: 24 }, sidebarMobile: { width: '100%', height: 70, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  brandBlock: { flexDirection: 'row', gap: 11, alignItems: 'center', marginBottom: 32 }, brandMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#4AF0E3', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: '#010A11', fontWeight: '900', fontSize: 18 }, brand: { color: 'white', fontWeight: '900', letterSpacing: 1.8, fontSize: 16 }, brandLine: { color: '#8FE8E1', fontSize: 14, letterSpacing: 1.5, marginTop: 2 },
  navigation: { gap: 6 }, navigationMobile: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5 }, navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 }, navItemMobile: { paddingHorizontal: 8 }, navActive: { backgroundColor: '#062A4E' }, navGlyph: { color: '#4AF0E3', fontSize: 18, minWidth: 20, textAlign: 'center' }, navLabel: { color: '#7A96A8', fontWeight: '700', fontSize: 14 }, navLabelActive: { color: 'white' },
  sidebarFoot: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 }, statusDot: { width: 7, height: 7, backgroundColor: '#4AF0E3', borderRadius: 4 }, sidebarStatus: { color: '#7A96A8', fontSize: 14, letterSpacing: 1.2, fontWeight: '800' },
  main: { flex: 1, minWidth: 0 }, topbar: { minHeight: 74, backgroundColor: '#061B2D', borderBottomWidth: 1, borderBottomColor: '#12314B', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topTank: { color: ink, fontSize: 15, fontWeight: '800' }, topStatus: { color: '#7A96A8', fontSize: 14, marginTop: 3 }, topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 }, homeLink: { color: '#4AF0E3', fontSize: 13, fontWeight: '800' }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#062A4E', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: ink, fontWeight: '900' }, guestBadge: { color: '#8FE8E1', backgroundColor: '#062A4E', fontSize: 14, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18 },
  scroll: { flex: 1 }, content: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 24, paddingBottom: 110 },
  heroRow: { flexDirection: 'row', gap: 20, alignItems: 'center', justifyContent: 'space-between' }, heroCopy: { flex: 1, maxWidth: 680 }, kicker: { color: teal, fontWeight: '900', fontSize: 14, letterSpacing: 1.7, marginTop: 8, marginBottom: 10 }, hero: { color: ink, fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -1 }, subhero: { color: '#7A96A8', fontSize: 17, lineHeight: 26, marginTop: 10, marginBottom: 22, maxWidth: 680 }, heroOrb: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#062A4E', alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: '#12314B' }, heroOrbWater: { color: teal, fontSize: 38, lineHeight: 40 }, heroOrbText: { color: ink, fontSize: 14, letterSpacing: 1.2, fontWeight: '900' },
  panel: { backgroundColor: '#061B2D', borderRadius: 22, padding: 24, marginBottom: 14, borderWidth: 1, borderColor: '#12314B' }, panelAqua: { backgroundColor: '#062A4E', borderColor: '#12314B' }, panelDark: { backgroundColor: '#062A4E', borderColor: '#062A4E', padding: 24 }, panelAmber: { backgroundColor: '#17130d', borderColor: '#6e5413' }, panelTitle: { color: ink, fontWeight: '800', fontSize: 17, textTransform: 'capitalize' }, panelBody: { color: '#7A96A8', fontSize: 16, lineHeight: 24, marginTop: 6 }, darkKicker: { color: '#4AF0E3', fontWeight: '900', fontSize: 14, letterSpacing: 1.7 }, darkTitle: { color: 'white', fontWeight: '800', fontSize: 23, lineHeight: 28, marginTop: 8 }, darkBody: { color: '#A9C2BF', fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 630 }, darkAction: { color: '#B7C9C8', fontSize: 14, lineHeight: 21 }, dividerDark: { height: 1, backgroundColor: '#12314B', marginVertical: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }, grow: { flex: 1 }, pill: { backgroundColor: '#12314B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }, pillGood: { backgroundColor: '#063B34' }, pillWarn: { backgroundColor: '#4A3B10' }, pillOffline: { backgroundColor: '#4A221A' }, pillText: { color: ink, fontSize: 14, letterSpacing: 1, fontWeight: '900' }, lightButton: { alignSelf: 'flex-start', marginTop: 18, backgroundColor: '#4AF0E3', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 }, lightButtonText: { color: '#092f37', fontWeight: '900', fontSize: 14 },
  sectionTitle: { color: ink, fontSize: 19, fontWeight: '800', marginTop: 18, marginBottom: 12 }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }, metric: { flexGrow: 1, flexBasis: 190, minHeight: 128, padding: 18, borderRadius: 16, backgroundColor: '#061B2D', borderWidth: 1, borderColor: '#12314B' }, metricMuted: { backgroundColor: '#041523' }, metricLabel: { color: '#7A96A8', fontWeight: '900', fontSize: 14, letterSpacing: 1.3 }, metricValue: { color: ink, fontWeight: '800', fontSize: 24, marginTop: 14 }, metricNote: { color: '#7A96A8', fontSize: 14, marginTop: 7 },
  volume: { color: teal, fontWeight: '900', fontSize: 25 }, factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }, fact: { color: '#8FE8E1', backgroundColor: '#062A4E', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 9, fontSize: 14, fontWeight: '700' }, quiet: { color: teal, fontSize: 14, marginTop: 14, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 35, borderWidth: 1, borderColor: '#12314B', borderStyle: 'dashed', borderRadius: 18, backgroundColor: '#041523', marginBottom: 14 }, emptyGlyph: { color: '#4AF0E3', fontSize: 32 }, emptyTitle: { color: ink, fontWeight: '800', fontSize: 17, marginTop: 8 }, emptyBody: { color: '#7A96A8', textAlign: 'center', lineHeight: 21, maxWidth: 470, marginTop: 7, fontSize: 14 },
  path: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 12 }, pathNode: { backgroundColor: '#062A4E', color: ink, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, fontSize: 14, fontWeight: '900' }, arrow: { color: teal, fontWeight: '900' },
  rangeRow: { flexDirection: 'row', gap: 7, marginBottom: 16 }, range: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#12314B', borderRadius: 20 }, rangeActive: { backgroundColor: teal }, rangeText: { color: '#7A96A8', fontWeight: '800', fontSize: 14 }, rangeActiveText: { color: '#010A11' }, historyValue: { color: teal, fontSize: 22, fontWeight: '900' }, timeline: { flexDirection: 'row', gap: 12, paddingLeft: 8, paddingBottom: 20 }, timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4AF0E3', marginTop: 4 }, timelineTitle: { color: ink, fontWeight: '800', textTransform: 'capitalize' }, timelineBody: { color: '#7A96A8', fontSize: 14, marginTop: 4 },
  step: { flexDirection: 'row', gap: 13, marginBottom: 18 }, stepNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#062A4E', textAlign: 'center', paddingTop: 6, color: teal, fontWeight: '900' }, stepTitle: { color: ink, fontWeight: '800', fontSize: 14 }, disabledButton: { backgroundColor: '#12314B', borderRadius: 13, padding: 15, alignItems: 'center' }, disabledText: { color: '#7A96A8', fontWeight: '800' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#12314B' }, infoLabel: { color: '#7A96A8', fontSize: 14 }, infoValue: { color: ink, fontSize: 14, fontWeight: '800', textAlign: 'right', flexShrink: 1 }, evidence: { color: teal, fontSize: 14, lineHeight: 21, marginTop: 15, fontWeight: '700' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: teal, alignItems: 'center', justifyContent: 'center', shadowColor: '#072c31', shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, fabText: { color: '#010A11', fontSize: 29, marginTop: -2 }, footer: { textAlign: 'center', color: '#7A96A8', fontSize: 14, marginTop: 35, letterSpacing: .5 }
});
