import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import createTaskSchema from './schemas/create-task.schema.ts';
import getTaskSchema from './schemas/get-task.schema.ts';
import processTaskSchema from './schemas/process-task.schema.ts';
import { ServiceError } from '../error/handler.ts';
import { NoSchemaError, ValidationError } from '../config/error.config.ts';
import type { AnyValidateFunction } from 'ajv/dist/core.js';

const ajv = new Ajv({ allErrors: true, verbose: true, removeAdditional: true });
addFormats.default(ajv, { formats: ['url', 'uuid'] });
ajv.addSchema(createTaskSchema);
ajv.addSchema(getTaskSchema);
ajv.addSchema(processTaskSchema);

export const validate = <T = any>(data: T, schema: string) => {
  try {
      const validator = ajv.getSchema(schema);
      if (!validator) {
        throw new ServiceError(NoSchemaError, { schema });
      }
      const valid = validator(data);
      if (!valid) throw validator;
      return data;
    } catch (err) {
      if (err instanceof ServiceError) {
        throw err;
      }
      const parsedError = err as AnyValidateFunction;
      console.log(parsedError.errors);
      throw new ServiceError(ValidationError, { err: parsedError.errors });
    }
};
