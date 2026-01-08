import { initDb } from '../core/infra/db.infra.ts';
import { initBrokerConsumer } from '../core/infra/broker.infra.ts';
import dbConfig from '../core/config/db.config.ts';
import { BROKER_HOST, BROKER_GROUP_ID } from '../core/config/broker.config.ts';
import { RESIZER_TOPIC } from '../core/const/broker.const.ts';
import { handleMessage } from './broker/consumer.broker.ts';

try {
  await initDb(dbConfig.url, dbConfig.options);
  await initBrokerConsumer({ servers: BROKER_HOST, topic: RESIZER_TOPIC, groupId: BROKER_GROUP_ID, callback: handleMessage });
} catch (err) {
  console.log(err);
  process.exitCode = 1;
  throw err;
}
