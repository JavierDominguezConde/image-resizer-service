import { afterEach, describe, expect, jest, test } from '@jest/globals';

jest.spyOn(console, 'log').mockImplementation();

const mockAjv = jest.fn();
jest.unstable_mockModule('ajv', () => ({ Ajv: mockAjv }));

const ajvInstance = {
  addSchema: jest.fn(),
  getSchema: jest.fn()
};
mockAjv.mockReturnValue(ajvInstance);

const mockAjvFormats = jest.fn();
jest.unstable_mockModule('ajv-formats', () => ({ default: { default: mockAjvFormats } }));

const createTaskSchema = { $id: 'createTaskSchema', type: 'object' };
jest.unstable_mockModule('../../../../app/core/validator/schemas/create-task.schema.ts', () => ({ default: createTaskSchema }));
const getTaskSchema = { $id: 'getTaskSchema', type: 'object' };
jest.unstable_mockModule('../../../../app/core/validator/schemas/get-task.schema.ts', () => ({ default: getTaskSchema }));
const processTaskSchema = { $id: 'processTaskSchema', type: 'object' };
jest.unstable_mockModule('../../../../app/core/validator/schemas/process-task.schema.ts', () => ({ default: processTaskSchema }));

const mockServiceError = jest.fn();
jest.unstable_mockModule('../../../../app/core/error/handler.ts', () => ({ ServiceError: mockServiceError }));

const NoSchemaError = { code: 'NO_SCHEMA_ERROR' };
const ValidationError = { code: 'VALIDATION_ERROR' };
jest.unstable_mockModule('../../../../app/core/config/error.config.ts', () => ({ NoSchemaError, ValidationError }));

describe('Schema validator', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('importing the module should result in configuration being established', async () => {
    await import('../../../../app/core/validator/schema.validator.ts');
    expect(mockAjv).toHaveBeenCalledWith({ allErrors: true, verbose: true, removeAdditional: true });
    expect(mockAjvFormats).toHaveBeenCalledWith(ajvInstance, { formats: ['url', 'uuid'] });
    expect(ajvInstance.addSchema).toHaveBeenCalledTimes(3);
    expect(ajvInstance.addSchema).toHaveBeenCalledWith(createTaskSchema);
    expect(ajvInstance.addSchema).toHaveBeenCalledWith(getTaskSchema);
    expect(ajvInstance.addSchema).toHaveBeenCalledWith(processTaskSchema);
  });

  describe('validate', () => {
    const data = { some: 'info' };
    const schema = 'test-schema';

    test('Should validate data and return it if ok', async () => {
      const validator = jest.fn().mockReturnValue(true);
      ajvInstance.getSchema.mockReturnValue(validator);
      const { validate } = await import('../../../../app/core/validator/schema.validator.ts');

      const response = validate(data, schema);
      expect(response).toEqual(data);
      expect(ajvInstance.getSchema).toHaveBeenCalledWith(schema);
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw error if no schema was found', async () => {
      ajvInstance.getSchema.mockReturnValue(undefined);
      const { validate } = await import('../../../../app/core/validator/schema.validator.ts');
      const outputError = Object.create(mockServiceError.prototype);
      outputError.message = 'No schema';
      mockServiceError.mockReturnValue(outputError);

      await expect(async () => validate(data, schema)).rejects.toMatchObject(outputError);
      expect(ajvInstance.getSchema).toHaveBeenCalledWith(schema);
      expect(mockServiceError).toHaveBeenCalledWith(NoSchemaError, { schema });
    });

    test('Should throw error if validation failed', async () => {
      const validator = jest.fn().mockReturnValue(false);
      ajvInstance.getSchema.mockReturnValue(validator);
      const errors = [new Error('Data is wrong')];
      validator.errors = errors;
      const { validate } = await import('../../../../app/core/validator/schema.validator.ts');
      const outputError = Object.create(mockServiceError.prototype);
      outputError.message = 'Validation failed';
      mockServiceError.mockReturnValue(outputError);

      await expect(async () => validate(data, schema)).rejects.toMatchObject(outputError);
      expect(ajvInstance.getSchema).toHaveBeenCalledWith(schema);
      expect(mockServiceError).toHaveBeenCalledWith(ValidationError, { err: validator.errors });
    });
  });
});
