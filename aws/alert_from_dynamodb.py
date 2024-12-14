import json
import boto3

iot_client = boto3.client('iot-data', region_name='ap-northeast-1')

# 閾値
CO2_THRESHOLD = 2300
TOPIC_PREFIX = 'kagawa/kosen/denkilab/rpi'

def lambda_handler(event, context):
    # DynamoDBストリームのレコードを処理
    for record in event['Records']:
        print(f"Hundle Event: {record}")
        if record['eventName'] == 'INSERT':  # INSERTイベントのみ処理
            # 新しいイメージ（挿入されたデータ）
            new_image = record['dynamodb']['NewImage']
            print(new_image)
            # 必要なデータフィールドを取得
            device_id = new_image['device_id']['S']
            time = new_image['time']['S']
            temperature = new_image['temperature']['S']
            humidity = new_image['humidity']['S']
            co2 = int(new_image['co2']['S'])

            # 閾値を超えている場合
            if co2 > CO2_THRESHOLD:
                payload = {
                    'device_id': device_id,
                    'time': time,
                    'temperature': temperature,
                    'humidity': humidity,
                    'co2': co2,
                    'alert_code': 10001,
                    'message': 'CO2の値が基準値を超えています。'
                }
                response = iot_client.publish(
                    topic=TOPIC_PREFIX + "/" + device_id + "/alert",
                    qos=1,
                    payload=json.dumps(payload)
                )
                print(f"Published to IoT Core: {response}")
    return {'statusCode': 200}
