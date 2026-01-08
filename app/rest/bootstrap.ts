import { initDb } from '../core/infra/db.infra.ts';
import { initServer } from '../core/infra/server.infra.ts';
import { initProducer } from '../core/client/broker.client.ts';
import dbConfig from '../core/config/db.config.ts';
import { BROKER_HOST } from '../core/config/broker.config.ts';
import router from './routes/index.ts';

try {
  await initDb(dbConfig.url, dbConfig.options);
  await initProducer(BROKER_HOST);
  await initServer(router);
} catch (err) {
  console.log(err);
  process.exitCode = 1;
  throw err;
}
