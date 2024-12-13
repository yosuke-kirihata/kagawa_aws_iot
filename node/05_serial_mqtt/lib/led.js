import {Gpio} from "onoff";

//cat /sys/kernel/debug/gpio
const LED_PIN = 533;

const led = class {
  constructor() {
    // LED ピンをOUT方向に設定
    this.gpio = new Gpio(LED_PIN, 'out');
  }

  on(callback) {
    this.gpio.write(0, callback);
  }

  off(callback) {
    this.gpio.write(1, callback);
  }
};

export default new led();
