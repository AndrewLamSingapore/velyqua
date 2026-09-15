-- Durable, idempotent telemetry admission. This migration does not create a
-- competing identity authority; device credentials remain service-side only.
alter table public.sensor_readings add column if not exists reading_id text;
alter table public.sensor_readings add column if not exists sensor_id text;
alter table public.sensor_readings add column if not exists sequence bigint;
alter table public.sensor_readings add column if not exists normalized_value double precision;
alter table public.sensor_readings add column if not exists quality text not null default 'GOOD';
alter table public.sensor_readings add column if not exists simulated boolean not null default false;

create unique index if not exists sensor_readings_device_reading_unique
  on public.sensor_readings(device_id, reading_id);
create unique index if not exists sensor_readings_device_sensor_sequence_unique
  on public.sensor_readings(device_id, sensor_id, sequence)
  where sensor_id is not null and sequence is not null;

alter table public.device_registry add column if not exists stable_hardware_id text;
alter table public.device_registry add column if not exists last_sequence bigint;
alter table public.device_registry add column if not exists pipeline_state text not null default 'AWAITING_SENSORS';

comment on column public.sensor_readings.simulated is
  'True only for explicit development fixtures. Production UI must label and exclude these from physical claims.';
