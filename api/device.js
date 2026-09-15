const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { parseTelemetry, tokenHash } = require('./_telemetry.js');

function json(res, status, value) { res.status(status).json(value); }
function bearer(req) { const h = String(req.headers.authorization || ''); return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : ''; }
function publicClient() {
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const key = String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
}
function serviceClient() {
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
}
async function userFromBearer(req) {
  const token = bearer(req); const client = publicClient();
  if (!token || !client) return null;
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const route = String(req.query?.route || '');
  const db = serviceClient();
  if (!db) return json(res, 503, { error: 'Device backend is not configured.' });

  if (route === 'provision') {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
    const user = await userFromBearer(req);
    if (!user) return json(res, 401, { error: 'Valid VELYQUA session required.' });
    const name = String(req.body?.name || 'VELYQUA Sensor').trim().slice(0, 80);
    const deviceId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('base64url');
    const { error } = await db.from('device_registry').insert({ device_id: deviceId, user_id: user.id, name, token_hash: tokenHash(token) });
    if (error) return json(res, 500, { error: 'Device provisioning failed.' });
    return json(res, 201, { device_id: deviceId, device_token: token, note: 'Store this token on the device; it is returned only once.' });
  }

  if (route === 'telemetry') {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
    if (JSON.stringify(req.body || {}).length > 65536) return json(res, 413, { error: 'Telemetry payload too large.' });
    const deviceId = String(req.headers['x-device-id'] || '').trim();
    const token = bearer(req);
    if (!deviceId || !token) return json(res, 401, { error: 'Device credentials required.' });
    const { data: device, error: deviceError } = await db.from('device_registry').select('device_id,user_id,token_hash,enabled').eq('device_id', deviceId).maybeSingle();
    if (deviceError || !device || !device.enabled) return json(res, 401, { error: 'Invalid device.' });
    const expected = Buffer.from(String(device.token_hash));
    const actual = Buffer.from(tokenHash(token));
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return json(res, 401, { error: 'Invalid device token.' });
    const parsed = parseTelemetry(req.body);
    if (parsed.error) return json(res, 422, { error: parsed.error });
    const reading = parsed.value;
    const { error: insertError } = await db.from('sensor_readings').insert({ user_id: device.user_id, device_id: device.device_id, reading_id: reading.readingId, sensor_id: reading.sensorId, sequence: reading.sequence, tank_id: reading.tankId, metric: reading.metric, value: reading.rawValue, normalized_value: reading.normalizedValue, unit: reading.unit, observed_at: reading.observedAt, quality: reading.quality, simulated: false, metadata: reading.metadata });
    if (insertError?.code === '23505') return json(res, 200, { accepted: true, duplicate: true, reading_id: reading.readingId });
    if (insertError) return json(res, 500, { error: 'Telemetry persistence failed.' });
    await db.from('device_registry').update({ last_seen_at: new Date().toISOString(), firmware_version: reading.firmwareVersion ?? undefined, last_sequence: reading.sequence, pipeline_state: reading.quality === 'GOOD' ? 'LIVE' : 'DELAYED' }).eq('device_id', device.device_id);
    await db.from('spine_events').insert({ id: crypto.randomUUID(), user_id: device.user_id, correlation_id: `telemetry:${device.device_id}:${Date.now()}`, event_type: 'sensor.reading_ingested', aggregate_type: 'device', aggregate_id: device.device_id, payload: { tank_id: reading.tankId, metric: reading.metric, observed_at: reading.observedAt } });
    return json(res, 202, { accepted: true, duplicate: false, reading_id: reading.readingId, quality: reading.quality, received_at: new Date().toISOString() });
  }

  return json(res, 404, { error: 'Route not found.' });
};
