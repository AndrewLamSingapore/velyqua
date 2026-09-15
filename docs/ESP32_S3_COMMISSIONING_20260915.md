# FireBeetle 2 ESP32-S3 commissioning evidence

**Status:** PASS — bare development node commissioned
**Captured:** 15 September 2026
**Execution host:** `DESKTOP-IPV4PH9`
**Portfolio authority read:** PRIME `main` at `94c19de5c746b58d11b7fa2bf8d03fb6fa99837e`

The canonical PRIME operational manifest was `STALE` at that pinned revision.
This product-specific hardware result does not alter PRIME runtime, deployment,
client-acceptance, or portfolio-wide operational status.

## Proven scope

The physical DFRobot FireBeetle 2 ESP32-S3 on `COM8` was identified as an
ESP32-S3 revision 0.2 with two 240 MHz cores, 16 MB flash, 8 MB OPI PSRAM,
USB Serial/JTAG, and Wi-Fi MAC `A4:CB:8F:C0:1A:D8`.

Firmware build `velyqua-esp32s3-commissioning-v2` was compiled for:

`esp32:esp32:dfrobot_firebeetle2_esp32s3:FlashSize=16M,PSRAM=opi,USBMode=hwcdc,CDCOnBoot=cdc`

The complete 16 MB image was written to the device and esptool independently
verified the written-data hash before reset. Runtime evidence then demonstrated:

- hardware, heap, PSRAM and flash inventory;
- integer, floating-point, CRC, JSON and dual-core workload execution;
- controlled memory allocation;
- private-LAN Wi-Fi connection and Dell-to-node `/health` retrieval;
- forced Wi-Fi disconnect and recovery while local processing continued;
- a 30-minute stability interval with 17,796 generated and 17,796 processed
  synthetic records, queue depth 0, dropped records 0 and minimum free heap
  174,952 bytes;
- persistence across two firmware-initiated software restarts;
- zero panic, watchdog, Guru Meditation or exception markers.

## Integrity anchors

| Artifact | SHA-256 |
|---|---|
| Commissioning source | `E0DD2FAE5EEA35F5C6890CAAB48E193A0151422F4972809092193F9AB5CBE30A` |
| Application binary | `0A0F8190848AC69092117A1BD27C565ACFE57563F7C3546256ABF7FFFCB8262F` |
| Merged 16 MB image | `142AFB5955D03A8696F6E36BC8527236629F97CAB6A4416B8671CB079346F5AA` |
| Serial evidence | `C7D5CB5D5CBA0E7BF5AA84DF008A711D249142CA79D9EADA81C79A677DEBCCFA` |
| Network test | `1EFEAAA47FAE93CA656CFC0E2503720ED09CF38626527D300887AE25E918DD77` |
| Repository verification log | `E1F52B47491B6F727F2A6A3B2F49DC5AB4B1E9C33222520660D7600EC4EC06CC` |
| Commissioning receipt | `04183D7ED58084D7CE13CDFC9D2749F23C881CF491815BA83AEBB7B5B7418DCD` |

Every artifact hash listed inside the receipt was independently recomputed on
Dell and matched. The full local evidence package is intentionally excluded
from Git because it includes build/runtime artifacts; this tracked report is
the durable, non-secret integrity anchor.

Repository validation also passed: portfolio-contract integrity, TypeScript,
server syntax, 14 Vitest files/66 tests, three relay tests, and Stable Spine
policy checks.

## Explicit non-claims

No probe or external sensor was connected. All generated records were marked
synthetic. No RS-485, Modbus, actuator or aquarium equipment was accessed.
This result commissions the bare ESP32-S3 node and development path only; it
does not demonstrate aquarium sensing, real telemetry, calibration, sensor
fusion, or automatic control.

## Next evidence gate

Establish the exact manufacturer/model and pin or terminal identity of the
first intended sensor before any wiring or hardware-specific firmware work.
Then define its voltage, interface, calibration and failure-reporting contract.
