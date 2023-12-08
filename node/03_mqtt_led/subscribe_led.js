import mqtt from "mqtt";

import led from "../lib/led";
import { CONNECT_URL, MY_TOPIC } from "../config/config";

const client = mqtt.connect(CONNECT_URL);

client.on("connect", function () {
  console.log("subscriber.connected.");
});

client.subscribe(MY_TOPIC + "/led", function (_err, _granted) {
  console.log("subscriber.subscribed.");
});

client.on("message", function (topic, message) {
  console.log("subscriber.on.message", "topic:", topic, "message:", message.toString());

  if (topic === MY_TOPIC + "/led") {
    const str = message.toString();
    if (str === "on") {
      console.log("led on");
      led.on();
    } else if (str === "off") {
      console.log("led off");
      led.off();
    } else {
    }
  }
});
