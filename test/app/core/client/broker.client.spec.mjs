import { beforeAll, describe, expect, jest, test } from '@jest/globals';

const mockConnect = jest.fn().mockResolvedValue();
const mockSend = jest.fn().mockResolvedValue();
const mockProducer = jest.fn().mockReturnValue({ connect: mockConnect, send: mockSend });
const mockKafka = jest.fn().mockReturnValue({ producer: mockProducer });
jest.mock('@confluentinc/kafka-javascript', () => ({ KafkaJS: { Kafka: mockKafka } }));

const brokerClient = await import('../../../../app/core/client/broker.client.ts');

describe('Broker Client', () => {
  describe('initProducer', () => {
    const servers = 'broker1:9092';

    test('Should create and connect a producer', async () => {
      const response = await brokerClient.initProducer(servers);
      expect(response).toBeUndefined();
      expect(mockKafka).toHaveBeenCalledWith();
      expect(mockProducer).toHaveBeenCalledWith({ 'bootstrap.servers': servers });
      expect(mockConnect).toHaveBeenCalledWith();
    });
  });

  describe('sendMessage', () => {
    const message = { some: 'value' };
    const topic = 'test-topic';

    beforeAll(async () => {
      await brokerClient.initProducer('broker1:9092');
    });

    test('Should send message to producer', async () => {
      const response = await brokerClient.sendMessage(message, topic);
      expect(response).toBeUndefined();
      expect(mockSend).toHaveBeenCalledWith({ topic, messages: [{ value: JSON.stringify(message) }] });
    });
  });
});
