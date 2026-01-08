import { describe, expect, jest, test } from '@jest/globals';

jest.spyOn(console, 'log').mockImplementation();

const mockCreate = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOne = jest.fn();
jest.unstable_mockModule('../../../../app/core/db/models/task.model.ts', () => ({
  default: {
    create: mockCreate,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOne: mockFindOne
  }
}));

const mockServiceError = jest.fn();
jest.unstable_mockModule('../../../../app/core/error/handler.ts', () => ({ ServiceError: mockServiceError }));

const NotFoundError = { code: 'NOT_FOUND_ERROR' };
const StorageError = { code: 'STORAGE_ERROR' };
jest.unstable_mockModule('../../../../app/core/config/error.config.ts', () => ({ NotFoundError, StorageError }));

const mockRandomUUID = jest.fn();
jest.unstable_mockModule('node:crypto', () => ({ default: { randomUUID: mockRandomUUID } }));

const TaskDb = await import('../../../../app/core/db/task.db.ts');
const skippedFields = { _id: 'test-_id', __v: 1 };

describe('Task Db', () => {
  describe('saveNewTask', () => {
    const origin = { path: '/test/path' };
    const price = 24.5;

    test('Should create task and return it', async () => {
      const taskId = 'test-task-id';
      mockRandomUUID.mockReturnValue(taskId);
      const dbResponse = { taskId, price };
      const mockToObject = jest.fn().mockReturnValue({ ...skippedFields, ...dbResponse });
      mockCreate.mockResolvedValue({ toObject: mockToObject });

      const response = await TaskDb.default.saveNewTask(origin, price);
      expect(response).toEqual(dbResponse);
      expect(mockRandomUUID).toHaveBeenCalledWith();
      expect(mockCreate).toHaveBeenCalledWith({ origin, price, taskId });
      expect(mockToObject).toHaveBeenCalledWith();
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw error if db failed', async () => {
      const taskId = 'test-task-id';
      mockRandomUUID.mockReturnValue(taskId);
      const error = new Error('Db failed');
      mockCreate.mockRejectedValue(error);
      const outputError = new Error('Storage error');
      mockServiceError.mockReturnValue(outputError);

      await expect(TaskDb.default.saveNewTask(origin, price)).rejects.toThrow(outputError);
      expect(mockRandomUUID).toHaveBeenCalledWith();
      expect(mockCreate).toHaveBeenCalledWith({ origin, price, taskId });
      expect(mockServiceError).toHaveBeenCalledWith(StorageError, { origin, price });
    });
  });

  describe('updateTask', () => {
    const taskId = 'test-task-id';
    const update = { status: 'test-status' };

    test('Should update task and return it', async () => {
      const dbResponse = { taskId, status: 'test-status', path: '/test/path' };
      mockFindOneAndUpdate.mockResolvedValue({ ...skippedFields, ...dbResponse });

      const response = await TaskDb.default.updateTask(taskId, update);
      expect(response).toEqual(dbResponse);
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith({ taskId }, update, { lean: true });
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw error if could not find task', async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);
      const outputError = Object.create(mockServiceError.prototype);
      outputError.message = 'Task not found';
      mockServiceError.mockReturnValue(outputError);

      await expect(TaskDb.default.updateTask(taskId, update)).rejects.toMatchObject(outputError);
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith({ taskId }, update, { lean: true });
      expect(mockServiceError).toHaveBeenCalledWith(NotFoundError, { taskId });
    });

    test('Should throw error if db failed', async () => {
      const error = new Error('Db failed');
      mockFindOneAndUpdate.mockRejectedValue(error);
      const outputError = new Error('Storage error');
      mockServiceError.mockReturnValue(outputError);

      await expect(TaskDb.default.updateTask(taskId, update)).rejects.toThrow(outputError);
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith({ taskId }, update, { lean: true });
      expect(mockServiceError).toHaveBeenCalledWith(StorageError, { taskId, update });
    });
  });

  describe('getTask', () => {
    const taskId = 'test-task-id';

    test('Should find and return a task', async () => {
      const dbResponse = { taskId, path: '/test/path' };
      mockFindOne.mockResolvedValue(dbResponse);

      const response = await TaskDb.default.getTask(taskId);
      expect(response).toEqual(dbResponse);
      expect(mockFindOne).toHaveBeenCalledWith({ taskId }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw error if could not find task', async () => {
      mockFindOne.mockResolvedValue(null);
      const outputError = Object.create(mockServiceError.prototype);
      outputError.message = 'Task not found';
      mockServiceError.mockReturnValue(outputError);

      await expect(TaskDb.default.getTask(taskId)).rejects.toMatchObject(outputError);
      expect(mockFindOne).toHaveBeenCalledWith({ taskId }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).toHaveBeenCalledWith(NotFoundError, { taskId });
    });

    test('Should throw error if db failed', async () => {
      const error = new Error('Db failed');
      mockFindOne.mockRejectedValue(error);
      const outputError = new Error('Storage error');
      mockServiceError.mockReturnValue(outputError);

      await expect(TaskDb.default.getTask(taskId)).rejects.toThrow(outputError);
      expect(mockFindOne).toHaveBeenCalledWith({ taskId }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).toHaveBeenCalledWith(StorageError, { taskId });
    });
  });
});
