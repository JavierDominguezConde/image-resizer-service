import { describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { STATUS } from '../../app/core/const/status.const.ts';
import { RESIZER_TOPIC } from '../../app/core/const/broker.const.ts';

jest.spyOn(console, 'log').mockImplementation();

const mockCreate = jest.fn();
const mockFindOne = jest.fn();
jest.unstable_mockModule('../../app/core/db/models/task.model.ts', () => ({
  default: {
    create: mockCreate,
    findOne: mockFindOne
  }
}));

const mockFindImages = jest.fn();
jest.unstable_mockModule('../../app/core/db/models/image.model.ts', () => ({
  default: {
    find: mockFindImages
  }
}));

const mockSendMessage = jest.fn();
jest.unstable_mockModule('../../app/core/client/broker.client.ts', () => ({ sendMessage: mockSendMessage }));

const routes = await import('../../app/rest/routes/index.ts');

const app = express();
app.use(express.json());
app.use(routes.default);

describe('Integration tests', () => {
  describe('POST /tasks', () => {
    test('Should return taskId, status = "pending", and a price', async () => {
      mockCreate.mockImplementation(inputData => ({ toObject: () => ({ ...inputData, status: STATUS.PENDING }) }));
      mockSendMessage.mockResolvedValue();
      const origin = { url: 'http://test.url' };

      const response = await request(app).post('/tasks').send(origin).expect(201);
      expect(response.body).toEqual({
        taskId: expect.any(String),
        status: STATUS.PENDING,
        price: expect.any(Number)
      });
      expect(mockCreate).toHaveBeenCalledWith({ origin, price: expect.any(Number), taskId: expect.any(String) });
      expect(mockSendMessage).toHaveBeenCalledWith({ taskId: response.body.taskId }, RESIZER_TOPIC);
    });
  });

  describe('GET /tasks/:taskId', () => {
    const taskId = 'b40484f0-adb9-4881-a100-2faa71082766';

    test('Should return only price and status for a pending task', async () => {
      const task = { taskId, origin: { path: '/test/path' }, price: 15.8, status: STATUS.PENDING };
      mockFindOne.mockResolvedValue(task);
      mockFindImages.mockResolvedValue([]);

      const response = await request(app).get(`/tasks/${taskId}`).expect(200);
      expect(response.body).toEqual({ ...task, origin: undefined });
      expect(mockFindOne).toHaveBeenCalledWith({ taskId }, expect.anything(), { lean: true });
      expect(mockFindImages).toHaveBeenCalledWith({ relatedTaskId: taskId }, expect.anything(), { lean: true });
    });

    test('Should also return created images if task is completed', async () => {
      const task = { taskId, origin: { path: '/test/path' }, price: 15.8, status: STATUS.COMPLETED };
      mockFindOne.mockResolvedValue(task);
      const images = [
        { path: '/output/sample-image/1024/1234567.png', md5: '1234567', resolution: '1024', relatedTaskId: taskId },
        { path: '/output/sample-image/800/9867345.png', md5: '9867345', resolution: '800', relatedTaskId: taskId }
      ];
      const summarizedImages = images.map(({ resolution, path }) => ({ resolution, path }));
      mockFindImages.mockResolvedValue(images);

      const response = await request(app).get(`/tasks/${taskId}`).expect(200);
      expect(response.body).toEqual({ ...task, images: summarizedImages, origin: undefined });
      expect(mockFindOne).toHaveBeenCalledWith({ taskId }, expect.anything(), { lean: true });
      expect(mockFindImages).toHaveBeenCalledWith({ relatedTaskId: taskId }, expect.anything(), { lean: true });
    });

    test('Should return 404 if requested task does not exist', async () => {
      mockFindOne.mockResolvedValue(null);

      await request(app).get(`/tasks/${taskId}`).expect(404);
      expect(mockFindOne).toHaveBeenCalledWith({ taskId }, expect.anything(), { lean: true });
      expect(mockFindImages).not.toHaveBeenCalled();
    });
  });
});
