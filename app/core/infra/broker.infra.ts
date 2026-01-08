import { KafkaJS } from '@confluentinc/kafka-javascript';

type BrokerConfig = {
  servers: string;
  topic: string;
  groupId: string;
  callback: (message: string) => Promise<void>
};

export const initBrokerConsumer = async (config: BrokerConfig) => {
  const { servers, topic, groupId, callback } = config;
  console.log('Connecting to brokers:', servers);
  const consumer = new KafkaJS.Kafka().consumer({
    'bootstrap.servers': servers,
    'group.id': groupId
  });
  await consumer.connect();
  const admin = consumer.dependentAdmin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic }] });
  await consumer.subscribe({ topics: [topic] });

  consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value) {
        await callback(message.value?.toString());
      }
    }
  });
  console.log('Broker consumer connected');
};
