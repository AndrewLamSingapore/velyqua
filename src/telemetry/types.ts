export type SensorQuality = 'GOOD' | 'SUSPECT' | 'INVALID' | 'MISSING' | 'SIMULATED';
export type SensorHealth = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNCOMMISSIONED';

export type SensorDescriptor = {
  sensorId: string;
  nodeId: string;
  type: string;
  manufacturer?: string;
  model?: string;
  unit: string;
  calibrationState: 'CALIBRATED' | 'DUE' | 'UNKNOWN' | 'NOT_APPLICABLE';
  commissioned: boolean;
};

export type TelemetryReading = {
  readingId: string;
  schemaVersion: '1.0.0';
  sensorId: string;
  nodeId: string;
  sequence: number;
  observedAt: string;
  receivedAt: string;
  rawValue: number;
  normalizedValue: number;
  unit: string;
  quality: SensorQuality;
  simulated: boolean;
};

export type EdgeNode = {
  nodeId: string;
  displayName: string;
  hardware: string;
  firmware: string;
  commissioned: boolean;
  commissionedEvidence: string;
  lastSeenAt?: string;
  uptimeSeconds?: number;
  wifiState: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  pipelineState: 'LIVE' | 'DELAYED' | 'OFFLINE' | 'AWAITING_SENSORS';
};
