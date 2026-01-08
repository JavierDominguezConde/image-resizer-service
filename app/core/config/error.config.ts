import type { ServiceErrorConfig } from '../error/handler.ts';
import { status } from 'http-status';

export const NotFoundError: ServiceErrorConfig = {
  message: 'Could not find desired task',
  code: 'TASK_NOT_FOUND',
  httpStatus: status.NOT_FOUND
};

export const ImageNotFoundError: ServiceErrorConfig = {
  message: 'Could not find desired image',
  code: 'IMAGE_NOT_FOUND',
  httpStatus: status.NOT_FOUND
};

export const StorageError: ServiceErrorConfig = {
  message: 'There was an unexpected error in storage',
  code: 'STORAGE_ERROR',
  httpStatus: status.INTERNAL_SERVER_ERROR
};

export const FetchError: ServiceErrorConfig = {
  message: 'There was an error while fetching the image',
  code: 'IMAGE_FETCH_ERROR',
  httpStatus: status.INTERNAL_SERVER_ERROR
};

export const NotImageError: ServiceErrorConfig = {
  message: 'The url did not return an image',
  code: 'NOT_AN_IMAGE_ERROR',
  httpStatus: status.UNPROCESSABLE_ENTITY
};

export const UnsupportedFormat: ServiceErrorConfig = {
  message: 'Image format not supported',
  code: 'UNSUPPORTED_FORMAT_ERROR',
  httpStatus: status.UNSUPPORTED_MEDIA_TYPE
};

export const ImageFileMissing: ServiceErrorConfig = {
  message: 'Image file was not found in specified path',
  code: 'IMAGE_FILE_MISSING_ERROR',
  httpStatus: status.NOT_FOUND
};

export const SharpError: ServiceErrorConfig = {
  message: 'Error processing images',
  code: 'IMG_PROCESSING_ERROR',
  httpStatus: status.INTERNAL_SERVER_ERROR
};

export const NoSchemaError: ServiceErrorConfig = {
  message: 'No schema configured for that identifier',
  code: 'NO_SCHEMA_ERROR',
  httpStatus: status.INTERNAL_SERVER_ERROR
};

export const ValidationError: ServiceErrorConfig = {
  message: 'Invalid input data',
  code: 'VALIDATION_ERROR',
  httpStatus: status.UNPROCESSABLE_ENTITY
};
