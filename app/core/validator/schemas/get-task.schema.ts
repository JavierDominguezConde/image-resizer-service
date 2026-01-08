import type { SchemaObject } from "ajv";
import SCHEMAS from '../../const/schema.const.ts';

const getTaskSchema: SchemaObject = {
  $id: SCHEMAS.GET_TASK,
  type: 'object',
  properties: {
    taskId: {
      type: 'string',
      format: 'uuid'
    }
  },
  required: ['taskId']
};
export default getTaskSchema;
