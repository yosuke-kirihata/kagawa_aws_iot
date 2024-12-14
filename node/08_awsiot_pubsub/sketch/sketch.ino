#include <Wire.h>
#include <SensirionI2CScd4x.h>
#include <Servo.h>

SensirionI2CScd4x scd4x;
Servo myServo;

unsigned long lastSCD4xTime = 0;      // SCD4xデータ取得のタイマー
unsigned long servoMoveStartTime = 0; // サーボモーターの回転開始時刻
bool isServoMoving = false;           // サーボモーターが回転中かどうか
int servoTargetAngle = 0;             // サーボの目標角度
int servoCurrentAngle = 0;            // サーボの現在の角度
int servoDirection = 0;               // サーボの回転方向 (-1: 180度に向かって, 1: 0度に戻る)

void printUint16Hex(uint16_t value)
{
    Serial.print(value < 4096 ? "0" : "");
    Serial.print(value < 256 ? "0" : "");
    Serial.print(value < 16 ? "0" : "");
    Serial.print(value, HEX);
}

void printSerialNumber(uint16_t serial0, uint16_t serial1, uint16_t serial2)
{
    Serial.print("Serial: 0x");
    printUint16Hex(serial0);
    printUint16Hex(serial1);
    printUint16Hex(serial2);
    Serial.println();
}

void setup()
{
    Serial.begin(115200);
    while (!Serial)
    {
        delay(100);
    }

    Wire.begin();

    uint16_t error;
    char errorMessage[256];

    scd4x.begin(Wire);

    // センサーの設定
    error = scd4x.stopPeriodicMeasurement();
    if (error)
    {
        Serial.print("Error stopping previous measurement: ");
        Serial.println(error);
    }

    // シリアル番号の取得
    uint16_t serial0;
    uint16_t serial1;
    uint16_t serial2;
    error = scd4x.getSerialNumber(serial0, serial1, serial2);
    if (error)
    {
        Serial.print("Error trying to execute getSerialNumber(): ");
        errorToString(error, errorMessage, 256);
        Serial.println(errorMessage);
    }
    else
    {
        printSerialNumber(serial0, serial1, serial2);
    }

    // Start Measurement
    error = scd4x.startPeriodicMeasurement();
    if (error)
    {
        Serial.print("Error trying to execute startPeriodicMeasurement(): ");
        errorToString(error, errorMessage, 256);
        Serial.println(errorMessage);
    }

    Serial.println("Waiting for first measurement... (5 sec)");

    // サーボモーターの初期設定
    myServo.attach(3); // サーボモーターをデジタルピン3に接続
    myServo.write(0);  // サーボを0度に設定
}

void loop()
{
    uint16_t error;
    char errorMessage[256];

    // 5秒ごとにSCD4xセンサーからデータを取得
    if (millis() - lastSCD4xTime >= 5000)
    {
        lastSCD4xTime = millis();
        getSCD4xData();
    }

    // サーボモーター駆動
    if (isServoMoving)
    {
        moveServo();
    }

    // シリアルコマンドを受けてサーボモータ制御を開始
    if (Serial.available() > 0)
    {
        // CRLFのLFまで受信し、CRを削除
        String command = Serial.readStringUntil('\n');
        command.trim();
        if (command == "ALERT")
        {
            startServoMove();
        }
    }
}

// SCD4xセンサーからデータを取得してシリアルに送信
void getSCD4xData()
{
    uint16_t error;
    uint16_t co2 = 0;
    float temperature = 0.0f;
    float humidity = 0.0f;
    bool isDataReady = false;

    // データが準備できているか確認
    error = scd4x.getDataReadyFlag(isDataReady);
    if (error)
    {
        Serial.print("Error getting data ready flag: ");
        Serial.println(error);
        return;
    }

    if (!isDataReady)
    {
        return;
    }

    // 計測データを取得
    error = scd4x.readMeasurement(co2, temperature, humidity);
    if (error)
    {
        Serial.print("Error reading measurement: ");
        Serial.println(error);
    }
    else if (co2 == 0)
    {
        Serial.println("Invalid data detected, skipping.");
    }
    else
    {
        Serial.print(co2);
        Serial.print(",");
        Serial.print(temperature);
        Serial.print(",");
        Serial.println(humidity);
    }
}

// サーボモーターの始動前処理
void startServoMove()
{
    servoTargetAngle = 180;
    servoDirection = -1; // 180度に向かって回転
    servoCurrentAngle = 0;
    servoMoveStartTime = millis();
    isServoMoving = true;
}

// サーボモーターを動かす処理
void moveServo()
{
    unsigned long currentTime = millis();
    unsigned long elapsedTime = currentTime - servoMoveStartTime;

    // 2秒で180度回転する
    int moveDuration = 1000; // 1秒
    int angleDelta = map(elapsedTime, 0, moveDuration, 0, 180);

    if (servoDirection == -1)
    {
        servoCurrentAngle = angleDelta;
        if (servoCurrentAngle >= 180)
        {
            servoCurrentAngle = 180;
            servoDirection = 1; // 0度に戻る
            servoMoveStartTime = currentTime;
        }
    }
    else if (servoDirection == 1)
    {
        servoCurrentAngle = 180 - angleDelta;
        if (servoCurrentAngle <= 0)
        {
            servoCurrentAngle = 0;
            isServoMoving = false; // 動作終了
        }
    }

    myServo.write(servoCurrentAngle);
}