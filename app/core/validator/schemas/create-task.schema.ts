import type { SchemaObject } from "ajv";
import SCHEMAS from '../../const/schema.const.ts';

const createTaskSchema: SchemaObject = {
  $id: SCHEMAS.CREATE_TASK,
  oneOf: [
    {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'url',
          minLength: 1
        }
      },
      required: ['url']
    },
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          minLength: 1
        }
      },
      required: ['path']
    }
  ]
};
export default createTaskSchema;
