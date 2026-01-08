import type { SchemaObject } from "ajv";
import SCHEMAS from '../../const/schema.const.ts';

const processTaskSchema: SchemaObject = {
  $id: SCHEMAS.PROCESS_TASK,
  type: 'object',
  properties: {
    taskId: {
      type: 'string',
      format: 'uuid'
    }
  },
  required: ['taskId']
};
export default processTaskSchema;
