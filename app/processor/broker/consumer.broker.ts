import { processTask } from '../domain/task.domain.ts';
import { validate } from '../../core/validator/schema.validator.ts';
import SCHEMAS from '../../core/const/schema.const.ts';

export const handleMessage = async (message: string) => {
  try {
    console.log('Incoming message:', message);
    const messageContent = JSON.parse(message);
    const { taskId } = validate(messageContent, SCHEMAS.PROCESS_TASK) as { taskId: string };
    await processTask(taskId);
  } catch (err) {
    // Do not throw if the message processing failed, it must be a corrupted message,
    // just skip it and continue.
    console.log(err);
  }
};
