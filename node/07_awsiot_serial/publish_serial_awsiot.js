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
  device.publish(topic, message);
});

parser.on("error", function (err) {
  console.error("Error :", err);
});
