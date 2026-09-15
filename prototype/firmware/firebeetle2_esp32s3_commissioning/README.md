# FireBeetle 2 ESP32-S3 commissioning firmware

This sketch commissions the bare DFRobot FireBeetle 2 ESP32-S3. It does not access sensors, RS-485, Modbus, actuators, or field hardware. Every generated VELYQUA measurement is explicitly synthetic.

The current firmware identifies itself as `velyqua-esp32s3-commissioning-v2`.
Its physical commissioning result and integrity anchors are recorded in
[`../../../docs/ESP32_S3_COMMISSIONING_20260915.md`](../../../docs/ESP32_S3_COMMISSIONING_20260915.md).

The firmware reports hardware, heap, PSRAM, flash, benchmark, Wi-Fi, recovery, queue, and 30-minute stability evidence as newline-delimited JSON over USB serial at 115200 baud.

Wi-Fi credentials belong only in local `secrets.h`, which is excluded by the repository `.gitignore`. `secrets.example.h` is safe to commit.

Target FQBN: `esp32:esp32:dfrobot_firebeetle2_esp32s3:FlashSize=16M,PSRAM=opi,USBMode=hwcdc,CDCOnBoot=cdc`.

Hardware CDC and CDC-on-boot are explicit because the board package default disables
application serial on the USB Serial/JTAG port. The 16 MB flash and OPI PSRAM settings
match the physical module inventory and runtime initialization evidence.

The owner-context commissioning runner is `../RUN-FIREBEETLE2-COMMISSIONING.ps1`.
