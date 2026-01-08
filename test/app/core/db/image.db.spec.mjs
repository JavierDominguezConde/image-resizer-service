import { describe, expect, jest, test } from '@jest/globals';

jest.spyOn(console, 'log').mockImplementation();

const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockFindOne = jest.fn();
jest.unstable_mockModule('../../../../app/core/db/models/image.model.ts', () => ({
  default: {
    create: mockCreate,
    find: mockFind,
    findOne: mockFindOne
  }
}));

const mockServiceError = jest.fn();
jest.unstable_mockModule('../../../../app/core/error/handler.ts', () => ({ ServiceError: mockServiceError }));

const ImageNotFoundError = { code: 'IMG_NOT_FOUND_ERROR' };
const StorageError = { code: 'STORAGE_ERROR' };
jest.unstable_mockModule('../../../../app/core/config/error.config.ts', () => ({ ImageNotFoundError, StorageError }));

const imageDb = await import('../../../../app/core/db/image.db.ts');

describe('Image Db', () => {
  describe('saveImage', () => {
    const path = '/test/path';
    const md5 = 'mock-3247f7da';
    const relatedTaskId = 'test-id';
    const resolution = '1024';

    test('Should create image in db and return it', async () => {
      const dbImage = { _id: 'test-_id', __v: 1, path, md5, createdAt: 'random-date' };
      const mockToObject = jest.fn().mockReturnValue(dbImage);
      mockCreate.mockResolvedValue({ toObject: mockToObject });

      const response = await imageDb.default.saveImage(path, md5, relatedTaskId, resolution);
      expect(response).toEqual({
        path: dbImage.path,
        md5: dbImage.md5,
        createdAt: dbImage.createdAt
      });
      expect(mockCreate).toHaveBeenCalledWith({ path, md5, relatedTaskId, resolution });
      expect(mockToObject).toHaveBeenCalledWith();
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should create image in db with default resolution and return it', async () => {
      const dbImage = { _id: 'test-_id', __v: 1, path, md5, createdAt: 'random-date' };
      const mockToObject = jest.fn().mockReturnValue(dbImage);
      mockCreate.mockResolvedValue({ toObject: mockToObject });

      const response = await imageDb.default.saveImage(path, md5, relatedTaskId);
      expect(response).toEqual({
        path: dbImage.path,
        md5: dbImage.md5,
        createdAt: dbImage.createdAt
      });
      expect(mockCreate).toHaveBeenCalledWith({ path, md5, relatedTaskId, resolution: 'original' });
      expect(mockToObject).toHaveBeenCalledWith();
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw ServiceError if db failed', async () => {
      const error = new Error('Db failed');
      mockCreate.mockRejectedValue(error);
      const outputError = new Error('Storage Error');
      mockServiceError.mockReturnValue(outputError);

      await expect(imageDb.default.saveImage(path, md5, relatedTaskId, resolution)).rejects.toThrow(outputError);
      expect(mockCreate).toHaveBeenCalledWith({ path, md5, relatedTaskId, resolution });
      expect(mockServiceError).toHaveBeenCalledWith(StorageError, { path, md5, relatedTaskId, resolution });
    });
  });

  describe('getImage', () => {
    const path = '/test/path';

    test('Should return image when found', async () => {
      const image = { path, relatedTaskId: 'test-id' };
      mockFindOne.mockResolvedValue(image);

      const response = await imageDb.default.getImage(path);
      expect(response).toEqual(image);
      expect(mockFindOne).toHaveBeenCalledWith({ path }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw error when image not found', async () => {
      mockFindOne.mockResolvedValue(null);
      const outputError = Object.create(mockServiceError.prototype);
      outputError.message = 'Image not found';
      mockServiceError.mockReturnValue(outputError);

      await expect(imageDb.default.getImage(path)).rejects.toMatchObject(outputError);
      expect(mockFindOne).toHaveBeenCalledWith({ path }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).toHaveBeenCalledWith(ImageNotFoundError, { path });
    });

    test('Should throw error if db failed', async () => {
      const error = new Error('Db failed');
      mockFindOne.mockRejectedValue(error);
      const outputError = new Error('Storage error');
      mockServiceError.mockReturnValue(outputError);

      await expect(imageDb.default.getImage(path)).rejects.toThrow(outputError);
      expect(mockFindOne).toHaveBeenCalledWith({ path }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).toHaveBeenCalledWith(StorageError, { path });
    });
  });

  describe('findTaskImages', () => {
    const taskId = 'test-id';

    test('Should return found images', async () => {
      const images = [{ path: '/path/1' }, { path: '/path/2' }];
      mockFind.mockResolvedValue(images);

      const response = await imageDb.default.findTaskImages(taskId);
      expect(response).toEqual(images);
      expect(mockFind).toHaveBeenCalledWith({ relatedTaskId: taskId }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw error if db failed', async () => {
      const error = new Error('Db failed');
      mockFind.mockRejectedValue(error);
      const outputError = new Error('Storage error');
      mockServiceError.mockReturnValue(outputError);

      await expect(imageDb.default.findTaskImages(taskId)).rejects.toThrow(outputError);
      expect(mockFind).toHaveBeenCalledWith({ relatedTaskId: taskId }, { _id: 0, __v: 0 }, { lean: true });
      expect(mockServiceError).toHaveBeenCalledWith(StorageError, { taskId });
    });
  });
});
