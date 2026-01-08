import { describe, expect, jest, test } from '@jest/globals';

const mockValidate = jest.fn();
jest.unstable_mockModule('../../../../../app/core/validator/schema.validator.ts', () => ({ validate: mockValidate }));

const { validateMiddleware } = await import('../../../../../app/rest/routes/middlewares/validator.middleware.ts');

describe('Validator middleware', () => {
  describe('validateMiddleware', () => {
    const res = {};
    const next = jest.fn();
    const schema = 'any-schema';

    test('Should return a middleware function', () => {
      const response = validateMiddleware('body', schema);
      expect(response).toBeInstanceOf(Function);
    });

    test('The middleware should validate received request body and continue', () => {
      const middleware = validateMiddleware('body', schema);
      const originalReq = { body: { info: 'valid' } };
      const req = structuredClone(originalReq);
      const validated = { info: 'validated' };
      mockValidate.mockReturnValue(validated);

      const response = middleware(req, res, next);
      expect(response).toBeUndefined();
      expect(req.body).toEqual(validated);
      expect(mockValidate).toHaveBeenCalledWith(originalReq.body, schema);
      expect(next).toHaveBeenCalledWith();
    });

    test('The middleware should validate received request params and continue', () => {
      const middleware = validateMiddleware('params', schema);
      const originalReq = { params: { info: 'valid' } };
      const req = structuredClone(originalReq);
      const validated = { info: 'validated' };
      mockValidate.mockReturnValue(validated);

      const response = middleware(req, res, next);
      expect(response).toBeUndefined();
      expect(req.params).toEqual(validated);
      expect(mockValidate).toHaveBeenCalledWith(originalReq.params, schema);
      expect(next).toHaveBeenCalledWith();
    });

    test('The middleware should continue with error if validation failed', () => {
      const middleware = validateMiddleware('params', schema);
      const originalReq = { params: { info: 'invalid' } };
      const req = structuredClone(originalReq);
      const error = new Error('Validation error');
      mockValidate.mockImplementation(() => { throw error; });

      const response = middleware(req, res, next);
      expect(response).toBeUndefined();
      expect(req.params).toEqual(originalReq.params);
      expect(mockValidate).toHaveBeenCalledWith(originalReq.params, schema);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
