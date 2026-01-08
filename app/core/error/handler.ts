import type { ErrorRequestHandler } from 'express';
import { status } from 'http-status';

const DEFAULT_STATUS = status.INTERNAL_SERVER_ERROR;
const DEFAULT_CODE = 'UNKNOWN_ERROR';

export type ServiceErrorConfig = {
  message: string;
  code: string;
  httpStatus: number;
};

export class ServiceError extends Error {
  code: string;
  httpStatus: number;
  data?: any;

  constructor(errorConfig: ServiceErrorConfig, data?: any) {
    super(errorConfig.message);
    this.code = errorConfig.code;
    this.httpStatus = errorConfig.httpStatus;
    this.data = data;
  }
}

const createOutputError = (message: string, status: number = DEFAULT_STATUS, code = DEFAULT_CODE, data: any = undefined) => {
  return { message, status, code, data };
};

export const serviceErrorHandler: ErrorRequestHandler = (err: ServiceError | Error | unknown, _req, res, _next) => {
  let error;
  if (err instanceof ServiceError) {
    error = createOutputError(err.message, err.httpStatus, err.code, err.data);
  } else if (err instanceof Error) {
    error = createOutputError(err.message);
  } else {
    error = createOutputError('Unknown error');
  }
  console.log('An error occured:', error);
  res.status(error.status).send(error);
};
