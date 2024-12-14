import awsIot from "aws-iot-device-sdk";
import dayjs from "dayjs";
import { SerialPort, ReadlineParser } from "serialport";

const BASE_CERT_PATH = "../crt/";
const PRIVATE_KEY_PATH = BASE_CERT_PATH + ""; //ex: hoge-private.pem.key
const CERT_PATH = BASE_CERT_PATH + ""; //ex: fuga-certificate.pem.crt
const ROOTCA_CERT_PATH = BASE_CERT_PATH + ""; //ex: AmazonRootCA1.pem
const UUID = ""; //ex:01
const ENDPOINT = ""; //ex: piyo.iot.ap-northeast-1.amazonaws.com

const topic = "kagawa/kosen/denkilab/rpi/" + UUID;

const topicToPublish = topic;
const topicToSubscribe = topic + "/alert";

const port = new SerialPort({
  path: "/dev/ttyACM0",
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
});

const parser = new ReadlineParser({ delimiter: "\r\n" });
port.pipe(parser);

const device = awsIot.device({
  keyPath: PRIVATE_KEY_PATH,
  certPath: CERT_PATH,
  caPath: ROOTCA_CERT_PATH,
  clientId: UUID,
  host: ENDPOINT,
});

device.on("connect", function () {
  console.log("connect");
  device.subscribe(topicToSubscribe);
});

parser.on("data", function (data) {
  const splited = data.split(",");
  if (splited.length !== 3) return;

  const message = JSON.stringify({
    time: dayjs().format("YYYY-MM-DDTHH:mm:ss.SSS"),
    temperature: splited[1],
    humidity: splited[2],
    co2: splited[0],
  });
  console.log(message);
  device.publish(topicToPublish, message);
});

device.on("message", function (topic, payload) {
  console.log(topic, payload.toString());

  try {
    const json = JSON.parse(payload.toString());
    console.log("Parsed JSON message:", json);

    if (json) {
      console.log("Sending command to serial port...");
      const serialCommand = "ALERT\n";
      port.write(serialCommand, (err) => {
        if (err) {
          console.error("Error writing to serial port:", err);
        } else {
          console.log("Serial command sent:", serialCommand);
        }
      });
    }
  } catch (error) {
    console.error("Error parsing JSON message:", error);
  }
});

// エラーハンドリング
parser.on("error", function (err) {
  console.error("Error:", err);
});
