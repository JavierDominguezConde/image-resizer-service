import { describe, expect, jest, test } from '@jest/globals';
import { RESIZER_TOPIC } from '../../../../app/core/const/broker.const.ts';

const mockSendMessage = jest.fn();
jest.unstable_mockModule('../../../../app/core/client/broker.client.ts', ()=> ({ sendMessage: mockSendMessage }));

const mockSaveNewTask = jest.fn();
const mockGetTask = jest.fn();
jest.unstable_mockModule('../../../../app/core/db/task.db.ts', () => ({
  default: {
    saveNewTask: mockSaveNewTask,
    getTask: mockGetTask
  }
}));

const mockFindTaskImages = jest.fn();
jest.unstable_mockModule('../../../../app/core/db/image.db.ts', () => ({
  default: {
    findTaskImages: mockFindTaskImages
  }
}));

const domain = await import('../../../../app/rest/domain/task.domain.ts');

describe('REST Task domain', () => {
  describe('createTask', () => {
    const taskRequest = { url: 'http://test.url' };

    test('Should creat new task and send message to processor', async () => {
      const randNumber = 0.34;
      const rand = jest.spyOn(global.Math, 'random').mockReturnValue(randNumber);
      const randResult = Math.round(randNumber * 450 + 50) / 10;
      const taskSummary = { taskId: '0000-0000', price: randNumber };
      const task = { ...taskSummary, origin: taskRequest, createdAt: 'today', updatedAt: 'also today' };
      mockSaveNewTask.mockResolvedValue(task);
      mockSendMessage.mockResolvedValue();

      const response = await domain.default.createTask(taskRequest);
      expect(response).toEqual(taskSummary);
      expect(rand).toHaveBeenCalledWith();
      expect(mockSaveNewTask).toHaveBeenCalledWith(taskRequest, randResult);
      expect(mockSendMessage).toHaveBeenCalledWith({ taskId: taskSummary.taskId }, RESIZER_TOPIC);
    });
  });

  describe('getTaskById', () => {
    const taskId = 'test-id';

    test('Should get task with related images in short form', async () => {
      const taskSummary = { taskId: '0000-0000', price: 12.7 };
      const task = { ...taskSummary, origin: { url: 'http://test.url' }, createdAt: 'today', updatedAt: 'also today' };
      mockGetTask.mockResolvedValue(task);
      const images = [{ resolution: 'original', path: '/test/path', md5: '9183645' }];
      mockFindTaskImages.mockResolvedValue(images);

      const response = await domain.default.getTaskById(taskId);
      expect(response).toEqual({ ...taskSummary, images: [{ ...images[0], md5: undefined }]});
      expect(mockGetTask).toHaveBeenCalledWith(taskId);
      expect(mockFindTaskImages).toHaveBeenCalledWith(taskId);
    });

    test('Should not include images if the list is empty', async () => {
      const taskSummary = { taskId: '0000-0000', price: 12.7 };
      const task = { ...taskSummary, origin: { url: 'http://test.url' }, createdAt: 'today', updatedAt: 'also today' };
      mockGetTask.mockResolvedValue(task);
      mockFindTaskImages.mockResolvedValue([]);

      const response = await domain.default.getTaskById(taskId);
      expect(response).toEqual(taskSummary);
      expect(mockGetTask).toHaveBeenCalledWith(taskId);
      expect(mockFindTaskImages).toHaveBeenCalledWith(taskId);
    });
  });
});
