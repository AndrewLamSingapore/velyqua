import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { evaluateTank } from '../domain/decisionEngine';
import { Tank } from '../domain/types';
import { CreatorConnection } from './CreatorConnection';

type Screen = 'home' | 'live' | 'history' | 'alerts' | 'people' | 'system';

const screens: Array<{ id: Screen; label: string; glyph: string }> = [
  { id: 'home', label: 'Home', glyph: '⌂' },
  { id: 'live', label: 'Live', glyph: '◉' },
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

function Home({ tank, onQuickUpdate }: { tank: Tank; onQuickUpdate: () => void }) {
  const recommendation = useMemo(() => evaluateTank(tank), [tank]);
  const latest = [...tank.readings].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];
  const state = tank.readings.length ? recommendation.state : 'more_information_needed';
  return <>
    <View style={styles.heroRow}>
      <View style={styles.heroCopy}><Text style={styles.kicker}>FOUNDING TANK</Text><Text style={styles.hero}>Understand your water. Care with clarity.</Text><Text style={styles.subhero}>A clearer picture of your aquarium, one observation at a time. Explore the app, add a water test, and help shape what comes next.</Text></View>
      <View style={styles.heroOrb}><Text style={styles.heroOrbWater}>≈</Text><Text style={styles.heroOrbText}>{state === 'all_clear' ? 'CALM' : 'LEARNING'}</Text></View>
    </View>
    <Panel tone="dark">
      <View style={styles.between}><View style={styles.grow}><Text style={styles.darkKicker}>RIGHT NOW</Text><Text style={styles.darkTitle}>{tank.readings.length ? recommendation.title : 'Waiting for your first physical readings'}</Text><Text style={styles.darkBody}>{tank.readings.length ? recommendation.reason : 'The app has not received any commissioned sensor values. No simulated value is being shown as real.'}</Text></View><Pill tone={tank.readings.length ? 'good' : 'warn'}>{tank.readings.length ? 'OBSERVED' : 'NO LIVE DATA'}</Pill></View>
      <View style={styles.dividerDark} />
      <Text style={styles.darkAction}>{tank.readings.length ? recommendation.action : 'Connect a physical sensor or add a manual water test.'}</Text>
      <Pressable style={styles.lightButton} onPress={onQuickUpdate}><Text style={styles.lightButtonText}>Add a real observation</Text></Pressable>
    </Panel>
    <Text style={styles.sectionTitle}>At a glance</Text>
    <View style={styles.metricGrid}>
      <Metric label="WATER" value={latest ? `${latest.value} ${latest.unit}` : '—'} note={latest ? `${latest.parameter} · ${ageLabel(latest.observedAt)}` : 'No physical readings'} muted={!latest} />
      <Metric label="SENSOR HEALTH" value="Awaiting" note="Physical probes untested" muted />
      <Metric label="EDGE NODE" value="Commissioned" note="Application link pending" />
      <Metric label="ALERTS" value="0 active" note="No fabricated alerts" />
    </View>
    <Text style={styles.sectionTitle}>Aquarium</Text>
    <Panel tone="aqua"><View style={styles.between}><View><Text style={styles.panelTitle}>{tank.name}</Text><Text style={styles.panelBody}>Planted freshwater community · Singapore</Text></View><Text style={styles.volume}>~{tank.volumeLitres} L</Text></View><View style={styles.factRow}><Text style={styles.fact}>{tank.livestock?.filter(x => x.status === 'active').length ?? 0} livestock groups</Text><Text style={styles.fact}>{tank.activities.length} care events</Text><Text style={styles.fact}>{tank.readings.length} readings</Text></View></Panel>
    <Text style={styles.sectionTitle}>Today</Text>
    <Panel><Text style={styles.panelTitle}>{recommendation.title}</Text><Text style={styles.panelBody}>{recommendation.reason}</Text><Text style={styles.quiet}>VELYQUA does not reward unnecessary intervention.</Text></Panel>
  </>;
}

function Live({ tank }: { tank: Tank }) {
  const readings = [...tank.readings].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  return <>
    <Text style={styles.kicker}>LIVE WATER</Text><Text style={styles.hero}>Physical readings, with their age and quality.</Text><Text style={styles.subhero}>Stale, missing and simulated values are always labelled.</Text>
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

function History({ tank }: { tank: Tank }) {
  const readings = [...tank.readings].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  return <><Text style={styles.kicker}>HISTORY</Text><Text style={styles.hero}>A record you can trust.</Text><Text style={styles.subhero}>Only owner observations and admitted physical telemetry belong here.</Text>
    <View style={styles.rangeRow}>{['24H', '7D', '30D', 'ALL'].map((value, index) => <View key={value} style={[styles.range, index === 3 && styles.rangeActive]}><Text style={[styles.rangeText, index === 3 && styles.rangeActiveText]}>{value}</Text></View>)}</View>
    {readings.length === 0 ? <Empty title="No water history yet" body="Connect a physical sensor or record a manual test. VELYQUA will never fill this chart with made-up readings." /> : readings.map(item => <Panel key={item.id}><View style={styles.between}><View><Text style={styles.panelTitle}>{item.parameter.replaceAll('_', ' ')}</Text><Text style={styles.panelBody}>{new Date(item.observedAt).toLocaleString()} · {item.method}</Text></View><Text style={styles.historyValue}>{item.value} {item.unit}</Text></View></Panel>)}
    <Text style={styles.sectionTitle}>Care timeline</Text>{tank.activities.slice(0, 8).map(item => <View key={item.id} style={styles.timeline}><View style={styles.timelineDot} /><View style={styles.grow}><Text style={styles.timelineTitle}>{item.type.replaceAll('_', ' ')}</Text><Text style={styles.timelineBody}>{item.note ?? 'No note'} · {new Date(item.occurredAt).toLocaleDateString()}</Text></View></View>)}
  </>;
}

function Alerts() {
  return <><Text style={styles.kicker}>ALERTS & EVENTS</Text><Text style={styles.hero}>Attention when it matters.</Text><Text style={styles.subhero}>INFO, WARNING, CRITICAL and RECOVERY events keep their source and evidence.</Text><Panel tone="aqua"><View style={styles.between}><View><Text style={styles.panelTitle}>No active alerts</Text><Text style={styles.panelBody}>There is not enough physical telemetry to assess aquarium thresholds.</Text></View><Pill tone="good">QUIET</Pill></View></Panel><Empty title="No event history" body="Connectivity, sensor health and threshold events will appear here after the physical telemetry path is admitted." /></>;
}

function People() {
  return <><Text style={styles.kicker}>TRUSTED PEOPLE & DEVICES</Text><Text style={styles.hero}>Invite once. Stay connected securely.</Text><Text style={styles.subhero}>Person, device, application, invitation, credential and session remain separate.</Text>
    <Panel tone="amber"><View style={styles.between}><View style={styles.grow}><Text style={styles.panelTitle}>PRIME enrollment integration pending</Text><Text style={styles.panelBody}>The VELYQUA client contract is ready. Invitations remain unavailable until ABEX supplies the corrected durable trust protocol.</Text></View><Pill tone="warn">FAIL CLOSED</Pill></View></Panel>
    <Text style={styles.sectionTitle}>Expected invitation journey</Text><Panel><View style={styles.step}><Text style={styles.stepNumber}>1</Text><View><Text style={styles.stepTitle}>Owner chooses access</Text><Text style={styles.panelBody}>Aquarium, telemetry and care permissions are application-scoped.</Text></View></View><View style={styles.step}><Text style={styles.stepNumber}>2</Text><View><Text style={styles.stepTitle}>One secure invitation</Text><Text style={styles.panelBody}>QR or link has an explicit ACTIVE, USED, EXPIRED or REVOKED state.</Text></View></View><View style={styles.step}><Text style={styles.stepNumber}>3</Text><View><Text style={styles.stepTitle}>Device enrolls once</Text><Text style={styles.panelBody}>The device refreshes sessions without storing a permanent bearer token.</Text></View></View></Panel>
    <Pressable accessibilityState={{ disabled: true }} style={styles.disabledButton}><Text style={styles.disabledText}>Invite person · integration pending</Text></Pressable>
  </>;
}

function System({ syncLabel }: { syncLabel: string }) {
  return <><Text style={styles.kicker}>SYSTEM</Text><Text style={styles.hero}>Health without the engineering noise.</Text><Text style={styles.subhero}>Open diagnostics only when you need the evidence.</Text>
    <Panel><View style={styles.between}><View style={styles.grow}><Text style={styles.panelTitle}>{commissionedNode.displayName}</Text><Text style={styles.panelBody}>{commissionedNode.hardware}</Text></View><Pill tone="warn">LINK PENDING</Pill></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Stable identity</Text><Text style={styles.infoValue}>{commissionedNode.nodeId}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Firmware</Text><Text style={styles.infoValue}>{commissionedNode.firmware}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Physical commissioning</Text><Text style={styles.infoValue}>PASS</Text></View><Text style={styles.evidence}>{commissionedNode.evidence}</Text></Panel>
    <Text style={styles.sectionTitle}>Connections</Text><Panel><View style={styles.infoRow}><Text style={styles.infoLabel}>Aquarium record</Text><Text style={styles.infoValue}>{syncLabel}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>ESP32 application link</Text><Text style={styles.infoValue}>Not observed</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Physical sensors</Text><Text style={styles.infoValue}>Untested</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>PRIME trust</Text><Text style={styles.infoValue}>Adapter ready</Text></View></Panel>
    <Text style={styles.sectionTitle}>Product boundary</Text><Panel><Text style={styles.panelBody}>VELYQUA owns aquarium observations. ABEX PRIME owns trusted identity, enrollment, authorization and production authority. This client cannot grant itself PRIME authority.</Text></Panel>
  </>;
}

export function ProductDashboard({ tank, syncLabel, publicAccess, onQuickUpdate, onAccount }: { tank: Tank; syncLabel: string; publicAccess: boolean; onQuickUpdate: () => void; onAccount: () => void }) {
  const [screen, setScreen] = useState<Screen>('home');
  const { width } = useWindowDimensions();
  const desktop = width >= 880;
  const content = screen === 'home' ? <Home tank={tank} onQuickUpdate={onQuickUpdate} /> : screen === 'live' ? <Live tank={tank} /> : screen === 'history' ? <History tank={tank} /> : screen === 'alerts' ? <Alerts /> : screen === 'people' ? <People /> : <System syncLabel={syncLabel} />;
  return <View style={[styles.shell, desktop && styles.shellDesktop]}>
    <View style={[styles.sidebar, !desktop && styles.sidebarMobile]}>
      <View style={styles.brandBlock}><View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>{desktop && <View><Text style={styles.brand}>VELYQUA</Text><Text style={styles.brandLine}>LIVING WATER</Text></View>}</View>
      <View style={[styles.navigation, !desktop && styles.navigationMobile]}>{screens.map(item => <Pressable key={item.id} onPress={() => setScreen(item.id)} accessibilityRole="tab" accessibilityState={{ selected: screen === item.id }} style={[styles.navItem, !desktop && styles.navItemMobile, screen === item.id && styles.navActive]}><Text style={styles.navGlyph}>{item.glyph}</Text>{desktop && <Text style={[styles.navLabel, screen === item.id && styles.navLabelActive]}>{item.label}</Text>}</Pressable>)}</View>
      {desktop && <View style={styles.sidebarFoot}><View style={styles.statusDot} /><Text style={styles.sidebarStatus}>{publicAccess ? 'GUEST DEVICE' : 'PRIVATE CLOUD'}</Text></View>}
    </View>
    <View style={styles.main}>
      <View style={styles.topbar}><View><Text style={styles.topTank}>{tank.name}</Text><Text style={styles.topStatus}>{syncLabel}</Text></View><Pressable onPress={onAccount} style={styles.avatar}><Text style={styles.avatarText}>{publicAccess ? 'G' : 'A'}</Text></Pressable></View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>{content}{screen === 'home' && <CreatorConnection />}<Text style={styles.footer}>VELYQUA · Intelligence for Living Water · Evidence before intervention</Text></ScrollView>
      <Pressable onPress={onQuickUpdate} accessibilityLabel="Add observation" style={styles.fab}><Text style={styles.fabText}>＋</Text></Pressable>
    </View>
  </View>;
}

const ink = '#102f36';
const teal = '#147c78';
const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f3f7f5' }, shellDesktop: { flexDirection: 'row' },
  sidebar: { width: 216, backgroundColor: '#092f37', paddingHorizontal: 18, paddingVertical: 24 }, sidebarMobile: { width: '100%', height: 70, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  brandBlock: { flexDirection: 'row', gap: 11, alignItems: 'center', marginBottom: 32 }, brandMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#b9f0df', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: '#073840', fontWeight: '900', fontSize: 18 }, brand: { color: 'white', fontWeight: '900', letterSpacing: 1.8, fontSize: 16 }, brandLine: { color: '#82b8b4', fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  navigation: { gap: 6 }, navigationMobile: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5 }, navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 }, navItemMobile: { paddingHorizontal: 8 }, navActive: { backgroundColor: '#18505a' }, navGlyph: { color: '#b9f0df', fontSize: 18, minWidth: 20, textAlign: 'center' }, navLabel: { color: '#b6cece', fontWeight: '700', fontSize: 14 }, navLabelActive: { color: 'white' },
  sidebarFoot: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 }, statusDot: { width: 7, height: 7, backgroundColor: '#75dcc3', borderRadius: 4 }, sidebarStatus: { color: '#92b9b8', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  main: { flex: 1, minWidth: 0 }, topbar: { minHeight: 74, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e9e6', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topTank: { color: ink, fontSize: 15, fontWeight: '800' }, topStatus: { color: '#6e8587', fontSize: 11, marginTop: 3 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#dcece8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: ink, fontWeight: '900' },
  scroll: { flex: 1 }, content: { width: '100%', maxWidth: 1020, alignSelf: 'center', padding: 24, paddingBottom: 110 },
  heroRow: { flexDirection: 'row', gap: 20, alignItems: 'center', justifyContent: 'space-between' }, heroCopy: { flex: 1, maxWidth: 680 }, kicker: { color: teal, fontWeight: '900', fontSize: 11, letterSpacing: 1.7, marginTop: 8, marginBottom: 10 }, hero: { color: ink, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1 }, subhero: { color: '#607578', fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 22, maxWidth: 680 }, heroOrb: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#d7f2e9', alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: '#e9f8f3' }, heroOrbWater: { color: teal, fontSize: 38, lineHeight: 40 }, heroOrbText: { color: ink, fontSize: 9, letterSpacing: 1.2, fontWeight: '900' },
  panel: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#e0e9e6' }, panelAqua: { backgroundColor: '#e7f5f0', borderColor: '#cce8df' }, panelDark: { backgroundColor: '#0b3841', borderColor: '#0b3841', padding: 24 }, panelAmber: { backgroundColor: '#fff7e7', borderColor: '#eedcad' }, panelTitle: { color: ink, fontWeight: '800', fontSize: 17, textTransform: 'capitalize' }, panelBody: { color: '#667a7d', fontSize: 13, lineHeight: 19, marginTop: 6 }, darkKicker: { color: '#77d9c0', fontWeight: '900', fontSize: 10, letterSpacing: 1.7 }, darkTitle: { color: 'white', fontWeight: '800', fontSize: 23, lineHeight: 28, marginTop: 8 }, darkBody: { color: '#bdd0d0', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 630 }, darkAction: { color: '#e9f6f2', fontSize: 14, lineHeight: 20 }, dividerDark: { height: 1, backgroundColor: '#2c5960', marginVertical: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }, grow: { flex: 1 }, pill: { backgroundColor: '#e6eceb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }, pillGood: { backgroundColor: '#c5f0df' }, pillWarn: { backgroundColor: '#f4d993' }, pillOffline: { backgroundColor: '#e4bdb4' }, pillText: { color: ink, fontSize: 9, letterSpacing: 1, fontWeight: '900' }, lightButton: { alignSelf: 'flex-start', marginTop: 18, backgroundColor: '#c4f0df', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 }, lightButtonText: { color: '#092f37', fontWeight: '900', fontSize: 13 },
  sectionTitle: { color: ink, fontSize: 19, fontWeight: '800', marginTop: 18, marginBottom: 12 }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }, metric: { flexGrow: 1, flexBasis: 190, minHeight: 128, padding: 18, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e9e6' }, metricMuted: { backgroundColor: '#f8faf9' }, metricLabel: { color: '#708487', fontWeight: '900', fontSize: 9, letterSpacing: 1.3 }, metricValue: { color: ink, fontWeight: '800', fontSize: 24, marginTop: 14 }, metricNote: { color: '#738689', fontSize: 11, marginTop: 7 },
  volume: { color: teal, fontWeight: '900', fontSize: 25 }, factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }, fact: { color: '#446467', backgroundColor: '#d7ece6', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 9, fontSize: 11, fontWeight: '700' }, quiet: { color: teal, fontSize: 11, marginTop: 14, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 35, borderWidth: 1, borderColor: '#dbe5e2', borderStyle: 'dashed', borderRadius: 18, backgroundColor: '#f8faf9', marginBottom: 14 }, emptyGlyph: { color: '#88aaa7', fontSize: 32 }, emptyTitle: { color: ink, fontWeight: '800', fontSize: 17, marginTop: 8 }, emptyBody: { color: '#718487', textAlign: 'center', lineHeight: 19, maxWidth: 470, marginTop: 7, fontSize: 13 },
  path: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 12 }, pathNode: { backgroundColor: '#e3efec', color: ink, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, fontSize: 10, fontWeight: '900' }, arrow: { color: teal, fontWeight: '900' },
  rangeRow: { flexDirection: 'row', gap: 7, marginBottom: 16 }, range: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#e7edeb', borderRadius: 20 }, rangeActive: { backgroundColor: ink }, rangeText: { color: '#667a7d', fontWeight: '800', fontSize: 10 }, rangeActiveText: { color: 'white' }, historyValue: { color: teal, fontSize: 22, fontWeight: '900' }, timeline: { flexDirection: 'row', gap: 12, paddingLeft: 8, paddingBottom: 20 }, timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#65c7b1', marginTop: 4 }, timelineTitle: { color: ink, fontWeight: '800', textTransform: 'capitalize' }, timelineBody: { color: '#74878a', fontSize: 12, marginTop: 4 },
  step: { flexDirection: 'row', gap: 13, marginBottom: 18 }, stepNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#d9eee8', textAlign: 'center', paddingTop: 6, color: teal, fontWeight: '900' }, stepTitle: { color: ink, fontWeight: '800', fontSize: 14 }, disabledButton: { backgroundColor: '#dfe6e4', borderRadius: 13, padding: 15, alignItems: 'center' }, disabledText: { color: '#7b8d8f', fontWeight: '800' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8eeec' }, infoLabel: { color: '#687d80', fontSize: 12 }, infoValue: { color: ink, fontSize: 12, fontWeight: '800', textAlign: 'right', flexShrink: 1 }, evidence: { color: teal, fontSize: 11, lineHeight: 17, marginTop: 15, fontWeight: '700' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: teal, alignItems: 'center', justifyContent: 'center', shadowColor: '#072c31', shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, fabText: { color: 'white', fontSize: 29, marginTop: -2 }, footer: { textAlign: 'center', color: '#91a19f', fontSize: 10, marginTop: 35, letterSpacing: .5 }
});
