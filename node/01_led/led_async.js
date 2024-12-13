import {Gpio} from "onoff";

//cat /sys/kernel/debug/gpio
const LED_PIN = 533;

// LED ピンをOUT方向に設定
const gpio = new Gpio(LED_PIN, 'out');

// LED ピンを設定 L:0/H:1
gpio.write(0, (err)=> {
  console.log('callback', err)
});

console.log('end');
