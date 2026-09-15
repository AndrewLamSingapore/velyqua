#include <Arduino.h>
#include <WiFi.h>
#include <esp_heap_caps.h>
#include <esp_system.h>
#include "secrets.h"

// VELYQUA commissioning firmware. All measurements produced here are SYNTHETIC.
// No sensor, RS-485, Modbus, actuator, or field-hardware access is performed.

namespace {
constexpr uint32_t kSerialBaud = 115200;
constexpr char kFirmwareBuild[] = "velyqua-esp32s3-commissioning-v2";
constexpr uint32_t kWifiRetryMs = 30000;
constexpr uint32_t kHealthIntervalMs = 60000;
constexpr uint32_t kStabilityTargetMs = 30UL * 60UL * 1000UL;
constexpr size_t kQueueCapacity = 256;

struct SyntheticRecord {
  uint32_t sequence;
  uint32_t uptime_ms;
  float soil_moisture;
  float temperature_c;
  float conductivity_us_cm;
  int32_t rssi;
  uint8_t health;
};

SyntheticRecord queueBuffer[kQueueCapacity];
size_t queueHead = 0;
size_t queueCount = 0;
uint32_t sequenceNumber = 0;
uint32_t generatedCount = 0;
uint32_t processedCount = 0;
uint32_t droppedCount = 0;
uint32_t reconnectCount = 0;
uint32_t wifiAttempts = 0;
uint32_t lastWifiAttempt = 0;
uint32_t lastHealth = 0;
uint32_t bootMs = 0;
uint32_t disconnectedAt = 0;
bool recoveryTestStarted = false;
bool recoveryTestPassed = false;
bool stabilityReported = false;
volatile uint32_t benchmarkSink = 0;
WiFiServer healthServer(80);
bool healthServerStarted = false;
bool restartPersistenceReported = false;
constexpr uint32_t kRestartStateMagic = 0x564C5951U;  // "VLYQ"

struct RestartState {
  uint32_t magic;
  uint32_t count;
};

// RTC_NOINIT_ATTR is required here: RTC_DATA_ATTR was reinitialized by the
// observed ESP.restart() path on this physical board/core combination.
RTC_NOINIT_ATTR RestartState commissioningRestartState;

struct TaskBenchmarkState {
  volatile bool done;
  volatile uint32_t result;
  uint32_t iterations;
};

void taskBenchmarkWorker(void* argument) {
  auto* state = static_cast<TaskBenchmarkState*>(argument);
  uint32_t value = 0x9E3779B9U;
  for (uint32_t i = 0; i < state->iterations; ++i) value = (value << 5) ^ (value >> 2) ^ i;
  state->result = value;
  state->done = true;
  vTaskDelete(nullptr);
}

void emit(const char* event, const String& fields = "") {
  Serial.print("{\"event\":\"");
  Serial.print(event);
  Serial.print("\",\"uptime_ms\":");
  Serial.print(millis());
  if (fields.length()) {
    Serial.print(',');
    Serial.print(fields);
  }
  Serial.println('}');
}

String ipText(const IPAddress& ip) {
  return ip.toString();
}

void emitInventory() {
  String fields = "\"chip\":\"" + String(ESP.getChipModel()) + "\"";
  fields += ",\"revision\":" + String(ESP.getChipRevision());
  fields += ",\"cores\":" + String(ESP.getChipCores());
  fields += ",\"cpu_mhz\":" + String(ESP.getCpuFreqMHz());
  fields += ",\"flash_bytes\":" + String(ESP.getFlashChipSize());
  fields += ",\"sketch_bytes\":" + String(ESP.getSketchSize());
  fields += ",\"free_sketch_bytes\":" + String(ESP.getFreeSketchSpace());
  fields += ",\"heap_bytes\":" + String(ESP.getHeapSize());
  fields += ",\"free_heap_bytes\":" + String(ESP.getFreeHeap());
  fields += ",\"min_free_heap_bytes\":" + String(ESP.getMinFreeHeap());
  fields += ",\"max_alloc_heap_bytes\":" + String(ESP.getMaxAllocHeap());
  fields += ",\"psram_bytes\":" + String(ESP.getPsramSize());
  fields += ",\"free_psram_bytes\":" + String(ESP.getFreePsram());
  fields += ",\"sdk\":\"" + String(ESP.getSdkVersion()) + "\"";
  emit("HARDWARE_INVENTORY", fields);
}

void serviceHealthServer() {
#if VELYQUA_WIFI_CONFIGURED
  if (WiFi.status() != WL_CONNECTED) return;
  if (!healthServerStarted) {
    healthServer.begin();
    healthServerStarted = true;
    emit("NETWORK_HEALTH_READY", "\"port\":80,\"path\":\"/health\"");
  }
  WiFiClient client = healthServer.accept();
  if (!client) return;
  client.setTimeout(250);
  String requestLine = client.readStringUntil('\n');
  while (client.connected()) {
    String header = client.readStringUntil('\n');
    if (header == "\r" || header.length() == 0) break;
  }
  const bool isHealth = requestLine.startsWith("GET /health ");
  const String body = isHealth
      ? "{\"node\":\"velyqua-firebeetle2-s3\",\"build\":\"" + String(kFirmwareBuild) +
            "\",\"status\":\"ok\",\"uptime_ms\":" + String(millis()) +
            ",\"free_heap\":" + String(ESP.getFreeHeap()) + "}"
      : "{\"status\":\"not_found\"}";
  client.print(isHealth ? "HTTP/1.1 200 OK\r\n" : "HTTP/1.1 404 Not Found\r\n");
  client.print("Content-Type: application/json\r\nConnection: close\r\nContent-Length: ");
  client.print(body.length());
  client.print("\r\n\r\n");
  client.print(body);
  client.stop();
  if (isHealth) emit("NETWORK_HEALTH_REQUEST", "\"result\":\"ok\"");
#endif
}

uint32_t crc32(const uint8_t* data, size_t length) {
  uint32_t crc = 0xFFFFFFFFU;
  for (size_t i = 0; i < length; ++i) {
    crc ^= data[i];
    for (uint8_t bit = 0; bit < 8; ++bit) {
      crc = (crc >> 1) ^ (0xEDB88320U & (0U - (crc & 1U)));
    }
  }
  return ~crc;
}

void runBenchmarks() {
  uint8_t payload[1024];
  for (size_t i = 0; i < sizeof(payload); ++i) payload[i] = static_cast<uint8_t>(i * 31U + 7U);

  uint32_t started = micros();
  volatile uint32_t integerValue = 0x12345678U;
  for (uint32_t i = 0; i < 500000; ++i) integerValue = integerValue * 1664525U + 1013904223U + i;
  uint32_t integerUs = micros() - started;

  started = micros();
  volatile float floatValue = 0.125f;
  for (uint32_t i = 1; i <= 100000; ++i) floatValue += sqrtf(static_cast<float>(i)) * 0.00001f;
  uint32_t floatUs = micros() - started;

  started = micros();
  uint32_t crcValue = 0;
  for (uint32_t i = 0; i < 1000; ++i) crcValue ^= crc32(payload, sizeof(payload));
  uint32_t crcUs = micros() - started;

  started = micros();
  String json;
  for (uint32_t i = 0; i < 1000; ++i) {
    json = "{\"device_id\":\"firebeetle2-s3\",\"sequence\":" + String(i) +
           ",\"synthetic\":true,\"temperature_c\":" + String(24.5f + (i % 10) * 0.1f, 2) + "}";
    benchmarkSink ^= json.length();
    benchmarkSink ^= json.indexOf("\"synthetic\":true") >= 0 ? 1U : 0U;
  }
  uint32_t jsonUs = micros() - started;

  benchmarkSink ^= integerValue ^ static_cast<uint32_t>(floatValue) ^ crcValue;
  String fields = "\"integer_iterations\":500000,\"integer_us\":" + String(integerUs);
  fields += ",\"float_iterations\":100000,\"float_us\":" + String(floatUs);
  fields += ",\"crc_bytes\":1024000,\"crc_us\":" + String(crcUs);
  fields += ",\"json_records\":1000,\"json_us\":" + String(jsonUs);
  fields += ",\"sink\":" + String(benchmarkSink);
  emit("BENCHMARK_COMPLETE", fields);
}

void runMemoryEnvelope() {
  const size_t before = ESP.getFreeHeap();
  size_t requested = min(static_cast<size_t>(ESP.getMaxAllocHeap() / 2), static_cast<size_t>(256 * 1024));
  uint8_t* block = static_cast<uint8_t*>(heap_caps_malloc(requested, MALLOC_CAP_8BIT));
  bool allocated = block != nullptr;
  if (allocated) {
    for (size_t i = 0; i < requested; i += 4096) block[i] = static_cast<uint8_t>(i);
    heap_caps_free(block);
  }
  String fields = "\"heap_before\":" + String(before);
  fields += ",\"controlled_allocation_bytes\":" + String(requested);
  fields += ",\"allocation_pass\":" + String(allocated ? "true" : "false");
  fields += ",\"heap_after\":" + String(ESP.getFreeHeap());
  fields += ",\"largest_block\":" + String(heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  emit("MEMORY_ENVELOPE", fields);
}

void runConcurrencyBenchmark() {
  TaskBenchmarkState first{false, 0, 300000};
  TaskBenchmarkState second{false, 0, 300000};
  uint32_t started = micros();
  BaseType_t createdFirst = xTaskCreatePinnedToCore(taskBenchmarkWorker, "velyqua-bench-a", 4096, &first, 1, nullptr, 0);
  BaseType_t createdSecond = xTaskCreatePinnedToCore(
      taskBenchmarkWorker, "velyqua-bench-b", 4096, &second, 1, nullptr, ESP.getChipCores() > 1 ? 1 : 0);
  uint32_t deadline = millis() + 10000;
  while ((!first.done || !second.done) && static_cast<int32_t>(deadline - millis()) > 0) delay(1);
  uint32_t elapsedUs = micros() - started;
  bool passed = createdFirst == pdPASS && createdSecond == pdPASS && first.done && second.done;
  benchmarkSink ^= first.result ^ second.result;
  String fields = "\"tasks\":2,\"iterations_per_task\":300000,\"elapsed_us\":" + String(elapsedUs);
  fields += ",\"dual_core\":" + String(ESP.getChipCores() > 1 ? "true" : "false");
  fields += ",\"pass\":" + String(passed ? "true" : "false");
  emit("CONCURRENCY_BENCHMARK", fields);
}

SyntheticRecord makeRecord() {
  SyntheticRecord record{};
  record.sequence = ++sequenceNumber;
  record.uptime_ms = millis();
  record.soil_moisture = 45.0f + static_cast<float>(record.sequence % 100) * 0.01f;
  record.temperature_c = 24.0f + static_cast<float>(record.sequence % 20) * 0.05f;
  record.conductivity_us_cm = 650.0f + static_cast<float>(record.sequence % 50);
  record.rssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;
  record.health = 1;
  return record;
}

void enqueue(const SyntheticRecord& record) {
  if (queueCount == kQueueCapacity) {
    queueHead = (queueHead + 1) % kQueueCapacity;
    --queueCount;
    ++droppedCount;
  }
  queueBuffer[(queueHead + queueCount) % kQueueCapacity] = record;
  ++queueCount;
}

bool validate(const SyntheticRecord& record) {
  return record.sequence > 0 && record.soil_moisture >= 0.0f && record.soil_moisture <= 100.0f &&
         record.temperature_c > -40.0f && record.temperature_c < 125.0f && record.conductivity_us_cm >= 0.0f;
}

void processSyntheticRecord() {
  SyntheticRecord record = makeRecord();
  ++generatedCount;
  if (!validate(record)) {
    emit("SYNTHETIC_VALIDATION_ERROR");
    return;
  }
  enqueue(record);
  String serialized = "{\"synthetic\":true,\"device_id\":\"firebeetle2-s3\",\"sequence\":" +
                      String(record.sequence) + ",\"uptime_ms\":" + String(record.uptime_ms) +
                      ",\"soil_moisture\":" + String(record.soil_moisture, 2) +
                      ",\"temperature_c\":" + String(record.temperature_c, 2) +
                      ",\"conductivity_us_cm\":" + String(record.conductivity_us_cm, 2) + "}";
  benchmarkSink ^= serialized.length();
  if (WiFi.status() == WL_CONNECTED && queueCount > 0) {
    // Drain faster than the generation cadence so offline backlog actually recovers.
    const size_t flushCount = min(queueCount, static_cast<size_t>(4));
    queueHead = (queueHead + flushCount) % kQueueCapacity;
    queueCount -= flushCount;
    processedCount += flushCount;
  }
}

void beginWifi() {
#if VELYQUA_WIFI_CONFIGURED
  ++wifiAttempts;
  lastWifiAttempt = millis();
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  emit("WIFI_CONNECT_ATTEMPT", "\"attempt\":" + String(wifiAttempts));
  WiFi.begin(VELYQUA_WIFI_SSID, VELYQUA_WIFI_PASSWORD);
#else
  emit("WIFI_NOT_CONFIGURED", "\"local_processing_continues\":true");
#endif
}

void wifiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
#if VELYQUA_WIFI_CONFIGURED
  if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
    emit("WIFI_DISCONNECT_REASON", "\"reason\":" + String(info.wifi_sta_disconnected.reason));
  }
#endif
}

void serviceWifi() {
#if VELYQUA_WIFI_CONFIGURED
  static wl_status_t previous = WL_NO_SHIELD;
  wl_status_t current = WiFi.status();
  if (current != previous) {
    if (current == WL_CONNECTED) {
      String fields = "\"ip\":\"" + ipText(WiFi.localIP()) + "\"";
      fields += ",\"gateway\":\"" + ipText(WiFi.gatewayIP()) + "\"";
      fields += ",\"rssi\":" + String(WiFi.RSSI());
      fields += ",\"mac\":\"" + WiFi.macAddress() + "\"";
      fields += ",\"connection_ms\":" + String(millis() - lastWifiAttempt);
      emit("WIFI_CONNECTED", fields);
      if (commissioningRestartState.count > 0 && !restartPersistenceReported) {
        restartPersistenceReported = true;
        emit("RESTART_PERSISTENCE_PASS", "\"restart_index\":" + String(commissioningRestartState.count));
      }
      if (disconnectedAt != 0) {
        recoveryTestPassed = true;
        ++reconnectCount;
        emit("WIFI_RECOVERY_PASS", "\"reconnect_ms\":" + String(millis() - disconnectedAt));
        disconnectedAt = 0;
      }
    } else if (previous == WL_CONNECTED) {
      emit("WIFI_DISCONNECTED", "\"local_processing_continues\":true");
    }
    previous = current;
  }
  if (current != WL_CONNECTED && millis() - lastWifiAttempt >= kWifiRetryMs) {
    WiFi.disconnect(false, false);
    delay(50);
    beginWifi();
  }
  if (current == WL_CONNECTED && !recoveryTestStarted && millis() - bootMs >= 60000) {
    recoveryTestStarted = true;
    disconnectedAt = millis();
    emit("WIFI_RECOVERY_TEST_START", "\"method\":\"software_disconnect\"");
    WiFi.disconnect(false, false);
    lastWifiAttempt = millis() - kWifiRetryMs + 5000;
  }
#endif
}

void emitHealth() {
  String fields = "\"free_heap\":" + String(ESP.getFreeHeap());
  fields += ",\"min_free_heap\":" + String(ESP.getMinFreeHeap());
  fields += ",\"free_psram\":" + String(ESP.getFreePsram());
  fields += ",\"rssi\":" + String(WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0);
  fields += ",\"generated\":" + String(generatedCount);
  fields += ",\"processed\":" + String(processedCount);
  fields += ",\"queue_depth\":" + String(queueCount);
  fields += ",\"dropped\":" + String(droppedCount);
  fields += ",\"reconnects\":" + String(reconnectCount);
  fields += ",\"reset_reason\":" + String(static_cast<int>(esp_reset_reason()));
  fields += ",\"chip_temperature_relative_c\":" + String(temperatureRead(), 2);
  emit("STABILITY_HEALTH", fields);
}
}  // namespace

void setup() {
  Serial.begin(kSerialBaud);
  const esp_reset_reason_t resetReason = esp_reset_reason();
  if (resetReason != ESP_RST_SW || commissioningRestartState.magic != kRestartStateMagic ||
      commissioningRestartState.count > 2) {
    commissioningRestartState.magic = kRestartStateMagic;
    commissioningRestartState.count = 0;
  }
  // Leave enough time for the post-flash host monitor to attach before evidence starts.
  delay(5000);
  bootMs = millis();
  emit("VELYQUA_NODE_ONLINE", "\"node\":\"velyqua-firebeetle2-s3\",\"build\":\"" + String(kFirmwareBuild) + "\"");
  emit("COMMISSIONING_BOOT", "\"synthetic_only\":true,\"sensors_connected\":false,\"actuation\":false,\"restart_index\":" + String(commissioningRestartState.count));
  emitInventory();
  runBenchmarks();
  runMemoryEnvelope();
  runConcurrencyBenchmark();
  WiFi.onEvent(wifiEvent);
  beginWifi();
}

void loop() {
  serviceWifi();
  serviceHealthServer();
  processSyntheticRecord();
  if (millis() - lastHealth >= kHealthIntervalMs) {
    lastHealth = millis();
    emitHealth();
  }
  if (!stabilityReported && commissioningRestartState.count == 0 && millis() - bootMs >= kStabilityTargetMs) {
    stabilityReported = true;
    const bool passed = recoveryTestPassed && droppedCount == 0 && queueCount == 0 && ESP.getMinFreeHeap() > 50000;
    String fields = "\"duration_ms\":" + String(millis() - bootMs);
    fields += ",\"wifi_recovery_pass\":" + String(recoveryTestPassed ? "true" : "false");
    fields += ",\"dropped\":" + String(droppedCount);
    fields += ",\"queue_depth\":" + String(queueCount);
    fields += ",\"min_free_heap\":" + String(ESP.getMinFreeHeap());
    emit(passed ? "STABILITY_PASS" : "STABILITY_FAIL", fields);
    if (passed) {
      commissioningRestartState.count = 1;
      emit("RESTART_TEST_START", "\"restart_index\":1");
      delay(2000);
      ESP.restart();
    }
  }
  if (commissioningRestartState.count == 1 && restartPersistenceReported && millis() - bootMs >= 60000) {
    commissioningRestartState.count = 2;
    emit("RESTART_TEST_START", "\"restart_index\":2");
    delay(2000);
    ESP.restart();
  }
  delay(100);
}
