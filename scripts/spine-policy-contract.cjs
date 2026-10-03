const assert = require('node:assert/strict');
const { validateEnvelope, classifyAction, POLICY } = require('../api/_spine');
function envelope(action, parameters = {}) { return { tenant_id:'tenant-1',actor_id:'user-1',actor_type:'user',action,parameters,context:{},correlation_id:'corr-1',idempotency_key:`idem-${action}`,schema_version:'1.0.0',timestamp:new Date().toISOString() }; }
assert.equal(validateEnvelope(envelope('sensor.read')), null);
assert.match(validateEnvelope({...envelope('sensor.read'),schema_version:'1'}),/must equal/);
assert.equal(classifyAction(envelope('sensor.read')).state, POLICY.AUTO);
assert.equal(classifyAction(envelope('sensor.health')).state, POLICY.AUTO);
assert.equal(classifyAction(envelope('heater.adjust',{delta_c:0.25})).state, POLICY.BOUNDED_AUTO);
assert.equal(classifyAction(envelope('heater.adjust',{delta_c:1})).state, POLICY.GATED);
assert.equal(classifyAction(envelope('dosing.execute')).state, POLICY.GATED);
assert.match(classifyAction(envelope('dosing.execute')).reason,/non-graduatable/);
assert.equal(classifyAction(envelope('unknown.action')).state, POLICY.GATED);
// An authorized alert must not be reported as executed until a durable alert
// connector actually persists or delivers it.
const { _test: { executeReflex, createHandler } } = require('../api/spine.js');

async function checkUnexecutedAlertEndpoint() {
  assert.equal(await executeReflex(null, null, envelope('alert.create', { message: 'test alert' })), null);

  const audits = [];
  const events = [];
  const db = {
    from(table) {
      if (table === 'spine_trust_registry') {
        return {
          select() { return this; },
          eq() { return this; },
          async maybeSingle() { return { data: null, error: null }; }
        };
      }
      if (table === 'spine_audit_log') {
        return {
          upsert(row) {
            audits.push(row);
            return { select() { return { async maybeSingle() { return { data: row, error: null }; } }; } };
          }
        };
      }
      if (table === 'spine_events') {
        return { async insert(row) { events.push(row); return { error: null }; } };
      }
      throw new Error(`Unexpected table ${table}`);
    }
  };
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  const handler = createHandler({
    authenticateRequest: async () => ({ id: 'tenant-1' }),
    serviceClientFactory: () => db
  });
  await handler({
    method: 'POST',
    headers: {},
    query: {},
    body: { action_envelope: envelope('alert.create', { message: 'test alert' }) }
  }, response);

  assert.equal(response.statusCode, 501);
  assert.equal(response.body.status, 'AUTHORIZED_NOT_EXECUTED');
  assert.deepEqual(response.body.verification, {
    command: 'NOT_SENT', execution: 'NOT_VERIFIED', outcome: 'PENDING'
  });
  assert.equal(response.body.result, undefined);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].execution_status, 'AUTHORIZED_NOT_EXECUTED');
  assert.equal(audits[0].verification_status, 'NOT_VERIFIED');
  assert.equal(audits[0].outcome_status, 'PENDING');
  assert.deepEqual(events.map((event) => event.event_type), ['action.authorized_waiting_connector']);
  assert.ok(!events.some((event) => event.event_type === 'action.completed'));
}

checkUnexecutedAlertEndpoint()
  .then(() => console.log('VELYQUA Stable Spine policy contract: OK'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
