import { describe, expect, jest, test } from '@jest/globals';

jest.spyOn(console, 'log').mockImplementation();

const mockSharpInstance = {
  resize: jest.fn(),
  toBuffer: jest.fn()
};
mockSharpInstance.resize.mockReturnValue(mockSharpInstance);
const mockSharp = jest.fn().mockReturnValue(mockSharpInstance);
jest.mock('sharp', () => mockSharp);

const mockServiceError = jest.fn();
jest.unstable_mockModule('../../../../app/core/error/handler.ts', () => ({ ServiceError: mockServiceError }));

const mockSharpError = {
  message: 'Test message',
  code: 'TEST_CODE',
  httpStatus: 500
};
jest.unstable_mockModule('../../../../app/core/config/error.config.ts', () => ({ SharpError: mockSharpError }));

// Dynamic importing to setup mocks previously
const sharpTools = await import('../../../../app/processor/tools/sharp.tool.ts');

describe('Sharp Tools', () => {
  describe('resizeImage', () => {
    const path = '/test/path';
    const width = 500;

    test('Should resize with provided params and return buffer', async () => {
      const mockBuffer = { type: 'Buffer', info: 'mocked' };
      mockSharpInstance.toBuffer.mockResolvedValue(mockBuffer);

      const buffer = await sharpTools.resizeImage(path, width);
      expect(buffer).toEqual(mockBuffer);
      expect(mockSharp).toHaveBeenCalledWith(path);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith({ width });
      expect(mockSharpInstance.toBuffer).toHaveBeenCalledWith();
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw ServiceError if could not perform action', async () => {
      const error = new Error('Sharp tools failed');
      mockSharpInstance.toBuffer.mockRejectedValue(error);
      const outputError = new Error('The process failed');
      mockServiceError.mockReturnValue(outputError);

      await expect(sharpTools.resizeImage(path, width)).rejects.toThrow(outputError);
      expect(mockSharp).toHaveBeenCalledWith(path);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith({ width });
      expect(mockSharpInstance.toBuffer).toHaveBeenCalledWith();
      expect(mockServiceError).toHaveBeenCalledWith(mockSharpError, { path, width });
    });
  });

  describe('getImageBuffer', () => {
    const path = '/test/path';

    test('Should return buffer', async () => {
      const mockBuffer = { type: 'Buffer', info: 'mocked' };
      mockSharpInstance.toBuffer.mockResolvedValue(mockBuffer);

      const buffer = await sharpTools.getImageBuffer(path);
      expect(buffer).toEqual(mockBuffer);
      expect(mockSharp).toHaveBeenCalledWith(path);
      expect(mockSharpInstance.toBuffer).toHaveBeenCalledWith();
      expect(mockServiceError).not.toHaveBeenCalled();
    });

    test('Should throw ServiceError if could not perform action', async () => {
      const error = new Error('Sharp tools failed');
      mockSharpInstance.toBuffer.mockRejectedValue(error);
      const outputError = new Error('The process failed');
      mockServiceError.mockImplementation(() => { throw outputError; });

      await expect(sharpTools.getImageBuffer(path)).rejects.toThrow(outputError);
      expect(mockSharp).toHaveBeenCalledWith(path);
      expect(mockSharpInstance.toBuffer).toHaveBeenCalledWith();
      expect(mockServiceError).toHaveBeenCalledWith(mockSharpError, { path });
    });
  });
});
