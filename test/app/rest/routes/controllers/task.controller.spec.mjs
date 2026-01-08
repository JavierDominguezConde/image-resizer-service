import { describe, expect, jest, test } from '@jest/globals';
import status from 'http-status';

jest.spyOn(console, 'log').mockImplementation();

const mockCreateTask = jest.fn();
const mockGetTaskById = jest.fn();
jest.unstable_mockModule('../../../../../app/rest/domain/task.domain.ts', () => ({
  default: {
    createTask: mockCreateTask,
    getTaskById: mockGetTaskById
  }
}));

const controller = await import('../../../../../app/rest/routes/controllers/task.controller.ts');

describe('Task controller', () => {
  describe('createTask', () => {
    const req = { body: { url: 'http://test-url' } };
    const res = { status: jest.fn(), send: jest.fn() };
    const next = jest.fn();

    test('Should create task and respond with the created task', async () => {
      const task = { taskId: '0000-0000', path: '/test/path' };
      mockCreateTask.mockResolvedValue(task);
      res.status.mockReturnValue(res);
      res.send.mockReturnValue(res);

      const response = await controller.createTask(req, res, next);
      expect(response).toBeUndefined();
      expect(mockCreateTask).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(status.CREATED);
      expect(res.send).toHaveBeenCalledWith(task);
      expect(next).not.toHaveBeenCalled();
    });

    test('Shouold throw if the domain failed', async () => {
      const error = new Error('Domain failed');
      mockCreateTask.mockRejectedValue(error);

      await expect(controller.createTask(req, res, next)).rejects.toThrow(error);
      expect(mockCreateTask).toHaveBeenCalledWith(req.body);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    const taskId = 'test-id';
    const req = { params: { taskId } };
    const res = { status: jest.fn(), send: jest.fn() };
    const next = jest.fn();

    test('Should get task from domain and respond with it', async () => {
      const task = { taskId, path: '/test/path' };
      mockGetTaskById.mockResolvedValue(task);

      const response = await controller.getTaskById(req, res, next);
      expect(response).toBeUndefined();
      expect(mockGetTaskById).toHaveBeenCalledWith(taskId);
      expect(res.send).toHaveBeenCalledWith(task);
      expect(res.status).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('Should throw if the domain failed', async () => {
      const error = new Error('Domain failed');
      mockGetTaskById.mockRejectedValue(error);

      await expect(controller.getTaskById(req, res, next)).rejects.toThrow(error);
      expect(mockGetTaskById).toHaveBeenCalledWith(taskId);
      expect(res.send).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});
