import { KafkaJS } from '@confluentinc/kafka-javascript';

let producer: KafkaJS.Producer;

export const initProducer = async (servers: string) => {
  producer = new KafkaJS.Kafka().producer({ 'bootstrap.servers': servers });

  await producer.connect();
};

export const sendMessage = async (message: any, topic: string) => {
  await producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
};
