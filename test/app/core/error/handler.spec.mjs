import { describe, expect, jest, test } from '@jest/globals';
import { status } from 'http-status';

jest.spyOn(console, 'log').mockImplementation();

const handler = await import('../../../../app/core/error/handler.ts');

describe('Error handler', () => {
  describe('ServiceError class', () => {
    test('Should create the Error object', () => {
      const config = { message: 'test-message', code: 'test-code', httpStatus: 400 };
      const data = { more: 'info' };

      const error = new handler.ServiceError(config, data);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toEqual(config.message);
      expect(error.code).toEqual(config.code);
      expect(error.httpStatus).toEqual(config.httpStatus);
      expect(error.data).toEqual(data);
    });
  });

  describe('serviceErrorHandler', () => {
    const req = {};
    const res = { status: jest.fn(), send: jest.fn() };
    res.status.mockReturnValue(res);
    res.send.mockReturnValue(res);
    const next = jest.fn();

    test('Should send error with provided info if ServiceError', () => {
      const message = 'Test message';
      const code = 'TEST_CODE';
      const httpStatus = 400;
      const data = { more: 'info' };
      const err = new handler.ServiceError({ message, code, httpStatus }, data);

      const response = handler.serviceErrorHandler(err, req, res, next);
      expect(response).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(httpStatus);
      expect(res.send).toHaveBeenCalledWith({ message, code, status: httpStatus, data });
      expect(next).not.toHaveBeenCalled();
    });

    test('Should send default with provided error message if normal Error', () => {
      const message = 'Test default message';
      const err = new Error(message);

      const response = handler.serviceErrorHandler(err, req, res, next);
      expect(response).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(status.INTERNAL_SERVER_ERROR);
      expect(res.send).toHaveBeenCalledWith({
        message,
        code: 'UNKNOWN_ERROR',
        status: status.INTERNAL_SERVER_ERROR
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('Should use default message in not an error was received', () => {
      const err = { type: 'not-an-error' };

      const response = handler.serviceErrorHandler(err, req, res, next);
      expect(response).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(status.INTERNAL_SERVER_ERROR);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Unknown error',
        code: 'UNKNOWN_ERROR',
        status: status.INTERNAL_SERVER_ERROR
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
