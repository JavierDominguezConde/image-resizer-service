import { describe, expect, jest, test } from '@jest/globals';
import { STATUS } from '../../../../app/core/const/status.const.ts';

jest.spyOn(console, 'log').mockImplementation();

const mockRandomUUID = jest.fn();
jest.unstable_mockModule('crypto', () => ({ default: { randomUUID: mockRandomUUID }}));

const mockDownloadImage = jest.fn();
const mockFindImage = jest.fn();
const mockSaveImageFromBuffer = jest.fn();
jest.unstable_mockModule('../../../../app/processor/client/file.client.ts', () => ({
  downloadImage: mockDownloadImage,
  findImage: mockFindImage,
  saveImageFromBuffer: mockSaveImageFromBuffer
}));

const mockGetTask = jest.fn();
const mockUpdateTask = jest.fn();
jest.unstable_mockModule('../../../../app/core/db/task.db.ts', () => ({
  default: {
    getTask: mockGetTask,
    updateTask: mockUpdateTask
  }
}));

const mockSaveImage = jest.fn();
jest.unstable_mockModule('../../../../app/core/db/image.db.ts', () => ({
  default: {
    saveImage: mockSaveImage
  }
}));

const mockServiceError = jest.fn();
jest.unstable_mockModule('../../../../app/core/error/handler.ts', () => ({ ServiceError: mockServiceError }));

const ImageFileMissing = { code: 'IMG_MISSING_ERROR' };
jest.unstable_mockModule('../../../../app/core/config/error.config.ts', () => ({ ImageFileMissing }));

const mockResizeImage = jest.fn();
const mockGetImageBuffer = jest.fn();
jest.unstable_mockModule('../../../../app/processor/tools/sharp.tool.ts', () => ({
  resizeImage: mockResizeImage,
  getImageBuffer: mockGetImageBuffer
}));

const domain = await import('../../../../app/processor/domain/task.domain.ts');

describe('Processor task domain', () => {
  describe('processTask', () => {
    const taskId = 'test-id';

    test('Should do nothing else if could not find task', async () => {
      const error = new Error('Task not found');
      mockGetTask.mockRejectedValue(error);

      await domain.processTask(taskId);
      expect(mockGetTask).toHaveBeenCalledWith(taskId);
      expect(mockDownloadImage).not.toHaveBeenCalled();
      expect(mockFindImage).not.toHaveBeenCalled();
      expect(mockUpdateTask).not.toHaveBeenCalled();
    });

    test('Should not do anything else if task was not pending', async () => {
      const task = { status: 'NOT-PENDING' };
      mockGetTask.mockResolvedValue(task);

      await domain.processTask(taskId);
      expect(mockGetTask).toHaveBeenCalledWith(taskId);
      expect(mockDownloadImage).not.toHaveBeenCalled();
      expect(mockFindImage).not.toHaveBeenCalled();
      expect(mockUpdateTask).not.toHaveBeenCalled();
    });

    describe('task contains an url', () => {
      const url = 'http://test.url';
      const task = { status: STATUS.PENDING, origin: { url }, taskId };

      beforeEach(() => {
        mockGetTask.mockResolvedValue(task);
      });

      test('Should download image and save it, then resize it', async () => {
        const path = '/output/test-name/original/12345654321.png';
        const md5 = '123456544321';
        const name = 'test-name';
        const extension = 'png';
        mockDownloadImage.mockResolvedValue({ path, md5 });
        mockSaveImage.mockResolvedValue();
        const buff1 = { data: 'data1' };
        const buff2 = { data: 'data2' };
        mockResizeImage.mockResolvedValueOnce(buff1).mockResolvedValueOnce(buff2);
        const path1 = '/output/test-name/1024/456754.png';
        const path2 = '/output/test-name/800/3548948.png';
        const md5_1 = '456754';
        const md5_2 = '3548948';
        mockSaveImageFromBuffer
        .mockResolvedValueOnce({ path: path1, md5: md5_1 })
        .mockResolvedValueOnce({ path: path2, md5: md5_2 });
        mockUpdateTask.mockResolvedValue();

        const response = await domain.processTask(taskId);
        expect(response).toBeUndefined();
        expect(mockDownloadImage).toHaveBeenCalledWith(url);
        expect(mockSaveImage).toHaveBeenCalledTimes(3);
        expect(mockSaveImage).toHaveBeenNthCalledWith(1, path, md5, taskId);
        expect(mockSaveImage).toHaveBeenNthCalledWith(2, path1, md5_1, taskId, '1024');
        expect(mockSaveImage).toHaveBeenNthCalledWith(3, path2, md5_2, taskId, '800');
        expect(mockResizeImage).toHaveBeenCalledTimes(2);
        expect(mockResizeImage).toHaveBeenNthCalledWith(1, path, 1024);
        expect(mockResizeImage).toHaveBeenNthCalledWith(2, path, 800);
        expect(mockSaveImageFromBuffer).toHaveBeenCalledTimes(2);
        expect(mockSaveImageFromBuffer).toHaveBeenNthCalledWith(1, buff1, name, extension, 1024);
        expect(mockSaveImageFromBuffer).toHaveBeenNthCalledWith(2, buff2, name, extension, 800);
        expect(mockUpdateTask).toHaveBeenCalledTimes(1);
        expect(mockUpdateTask).toHaveBeenCalledWith(taskId, { status: STATUS.COMPLETED });
        expect(mockFindImage).not.toHaveBeenCalled();
      });

      test('Should update task to failed if there was an error', async () => {
        const errMessage = 'Downloading failed';
        const error = new Error(errMessage);
        mockDownloadImage.mockRejectedValue(error);
        mockUpdateTask.mockResolvedValue();

        await domain.processTask(taskId);
        expect(mockDownloadImage).toHaveBeenCalledWith(url);
        expect(mockSaveImage).not.toHaveBeenCalled();
        expect(mockUpdateTask).toHaveBeenCalledWith(taskId, { status: STATUS.FAILED, error: { message: errMessage } });
        expect(mockFindImage).not.toHaveBeenCalled();
      });

      test('Should not throw even if updating task after failure also failed', async () => {
        const errMessage = 'Downloading failed';
        const error = new Error(errMessage);
        mockDownloadImage.mockRejectedValue(error);
        mockUpdateTask.mockRejectedValue(new Error('Update failed, data task will be forever pending'));

        await domain.processTask(taskId);
        expect(mockDownloadImage).toHaveBeenCalledWith(url);
        expect(mockSaveImage).not.toHaveBeenCalled();
        expect(mockUpdateTask).toHaveBeenCalledWith(taskId, { status: STATUS.FAILED, error: { message: errMessage } });
        expect(mockFindImage).not.toHaveBeenCalled();
      });
    });

    describe('task contains a path', () => {
      const originalPath = '/test/path/image-for-testing.jpg';
      const extension = 'jpg';
      const task = { status: STATUS.PENDING, origin: { path: originalPath }, taskId };

      beforeEach(() => {
        mockGetTask.mockResolvedValue(task);
      });

      test('Should copy image and save it, then resize it', async () => {
        const random = '0000-0000';
        mockRandomUUID.mockReturnValue(random);
        mockFindImage.mockReturnValue(true);
        const buff = { data: 'binary-data' };
        mockGetImageBuffer.mockResolvedValue(buff);
        const path = '/output/image-copy-0000-0000/original/12345.jpg';
        const md5 = '12345';
        mockSaveImageFromBuffer.mockResolvedValue({ path, md5 });
        const path1 = '/output/image-copy-0000-0000/1024/456754.png';
        const path2 = '/output/image-copy-0000-0000/800/3548948.png';
        const md5_1 = '456754';
        const md5_2 = '3548948';
        mockSaveImageFromBuffer
        .mockResolvedValueOnce({ path, md5 })
        .mockResolvedValueOnce({ path: path1, md5: md5_1 })
        .mockResolvedValueOnce({ path: path2, md5: md5_2 });
        mockSaveImage.mockResolvedValue();
        const buff1 = { data: 'data1' };
        const buff2 = { data: 'data2' };
        mockResizeImage.mockResolvedValueOnce(buff1).mockResolvedValueOnce(buff2);
        mockUpdateTask.mockResolvedValue();

        await domain.processTask(taskId);
        expect(mockRandomUUID).toHaveBeenCalledWith();
        expect(mockFindImage).toHaveBeenCalledWith(originalPath);
        expect(mockGetImageBuffer).toHaveBeenCalledWith(originalPath);
        expect(mockSaveImageFromBuffer).toHaveBeenCalledTimes(3);
        expect(mockSaveImageFromBuffer).toHaveBeenNthCalledWith(1, buff, 'image-copy-0000-0000', extension, 'original');
        expect(mockSaveImageFromBuffer).toHaveBeenNthCalledWith(2, buff1, 'image-copy-0000-0000', extension, 1024);
        expect(mockSaveImageFromBuffer).toHaveBeenNthCalledWith(3, buff2, 'image-copy-0000-0000', extension, 800);
        expect(mockSaveImage).toHaveBeenCalledTimes(3);
        expect(mockSaveImage).toHaveBeenNthCalledWith(1, path, md5, taskId);
        expect(mockSaveImage).toHaveBeenNthCalledWith(2, path1, md5_1, taskId, '1024');
        expect(mockSaveImage).toHaveBeenNthCalledWith(3, path2, md5_2, taskId, '800');
        expect(mockResizeImage).toHaveBeenCalledTimes(2);
        expect(mockResizeImage).toHaveBeenNthCalledWith(1, path, 1024);
        expect(mockResizeImage).toHaveBeenNthCalledWith(2, path, 800);
        expect(mockUpdateTask).toHaveBeenCalledWith(taskId, { status: STATUS.COMPLETED });
        expect(mockDownloadImage).not.toHaveBeenCalled();
      });

      test('Should not resize and update task to failed if image file is missing', async () => {
        mockFindImage.mockReturnValue(false);
        const outputError = new Error('Image missing');
        mockServiceError.mockReturnValue(outputError);
        mockUpdateTask.mockResolvedValue();

        await domain.processTask(taskId);
        expect(mockFindImage).toHaveBeenCalledWith(originalPath);
        expect(mockGetImageBuffer).not.toHaveBeenCalled();
        expect(mockServiceError).toHaveBeenCalledWith(ImageFileMissing, { path: originalPath });
        expect(mockUpdateTask).toHaveBeenCalledWith(taskId, { status: STATUS.FAILED, error: { ...outputError, message: outputError.message }})
      });
    });
  });
});
