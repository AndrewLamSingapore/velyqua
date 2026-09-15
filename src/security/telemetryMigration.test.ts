import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202609150001_resilient_telemetry.sql'), 'utf8');
const endpoint = fs.readFileSync(path.join(process.cwd(), 'api/device.js'), 'utf8');

describe('durable telemetry admission', () => {
  it('has database-level exactly-once constraints', () => {
    expect(migration).toContain('sensor_readings_device_reading_unique');
    expect(migration).toContain('sensor_readings_device_sensor_sequence_unique');
    expect(endpoint).toContain("insertError?.code === '23505'");
  });
  it('does not grant new browser write access', () => {
    expect(migration).not.toMatch(/grant\s+(insert|update|delete)/i);
    expect(migration).not.toMatch(/disable\s+row\s+level\s+security/i);
  });
});
