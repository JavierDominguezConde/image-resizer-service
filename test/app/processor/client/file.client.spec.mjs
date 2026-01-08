import { describe, expect, jest, test } from '@jest/globals';

jest.spyOn(console, 'log').mockImplementation();

const fetchSpy = jest.spyOn(global, 'fetch');

const mockMkdirSync = jest.fn();
const mockCreateWriteStream = jest.fn();
const mockRenameSync = jest.fn();
const mockAccessSync = jest.fn();
jest.unstable_mockModule('node:fs', () => ({
  default: {
    mkdirSync: mockMkdirSync,
    createWriteStream: mockCreateWriteStream,
    renameSync: mockRenameSync,
    accessSync: mockAccessSync
  }
}));

const mockRandomUUID = jest.fn();
const mockCreateHash = jest.fn();
jest.unstable_mockModule('node:crypto', () => ({
  default: {
    randomUUID: mockRandomUUID,
    createHash: mockCreateHash
  }
}));

const mockTransform = jest.fn();
const mockReadableFrom = jest.fn();
jest.unstable_mockModule('node:stream', () => ({
  Transform: mockTransform,
  Readable: { from: mockReadableFrom }
}));

const mockPipeline = jest.fn();
jest.unstable_mockModule('node:stream/promises', () => ({ pipeline: mockPipeline }));

const mockServiceError = jest.fn();
jest.unstable_mockModule('../../../../app/core/error/handler.ts', () => ({ ServiceError: mockServiceError }));

const FetchError = { code: 'FETCH_ERROR' };
const NotImageError = { code: 'NOT_IMAGE_ERROR' };
const UnsupportedFormat = { code: 'UNSUPPORTED_FORMAT' };
jest.unstable_mockModule('../../../../app/core/config/error.config.ts', () => ({ FetchError, NotImageError, UnsupportedFormat }));

const fileClient = await import('../../../../app/processor/client/file.client.ts');

describe('File client', () => {
  describe('downloadImage', () => {
    const url = 'http://test.url';

    test('Should throw error if response while getting image is not ok', async () => {
      const response = { ok: false };
      fetchSpy.mockResolvedValue(response);
      const outputError = new Error('Fetch failed');
      mockServiceError.mockReturnValue(outputError);

      await expect(fileClient.downloadImage(url)).rejects.toThrow(outputError);
      expect(fetchSpy).toHaveBeenCalledWith(url);
      expect(mockServiceError).toHaveBeenCalledWith(FetchError, { url });
    });

    test('Should throw error if content-type does not point to an image', async () => {
      const getHeader = jest.fn();
      getHeader.mockReturnValue('text/plain');
      const headers = { get: getHeader };
      fetchSpy.mockResolvedValue({ ok: true, headers });
      const outputError = new Error('Url pointed to no image');
      mockServiceError.mockReturnValue(outputError);

      await expect(fileClient.downloadImage(url)).rejects.toThrow(outputError);
      expect(fetchSpy).toHaveBeenCalledWith(url);
      expect(getHeader).toHaveBeenCalledWith('content-type');
      expect(mockServiceError).toHaveBeenCalledWith(NotImageError, { contentType: 'text/plain' });
    });

    test('Should throw error if response does not have an image body', async () => {
      const getHeader = jest.fn();
      getHeader.mockReturnValue('image/png');
      const headers = { get: getHeader };
      fetchSpy.mockResolvedValue({ ok: true, headers });
      const outputError = new Error('Response must contain a body');
      mockServiceError.mockReturnValue(outputError);

      await expect(fileClient.downloadImage(url)).rejects.toThrow(outputError);
      expect(fetchSpy).toHaveBeenCalledWith(url);
      expect(getHeader).toHaveBeenCalledWith('content-type');
      expect(mockServiceError).toHaveBeenCalledWith(NotImageError, { contentType: 'image/png' });
    });

    test('Should throw error if content-type is not supported', async () => {
      const getHeader = jest.fn();
      getHeader.mockReturnValue('image/unsupported');
      const headers = { get: getHeader };
      fetchSpy.mockResolvedValue({ ok: true, headers, body: 'some ReadabaleStream' });
      const outputError = new Error('Format not supported');
      mockServiceError.mockReturnValue(outputError);

      await expect(fileClient.downloadImage(url)).rejects.toThrow(outputError);
      expect(fetchSpy).toHaveBeenCalledWith(url);
      expect(getHeader).toHaveBeenCalledWith('content-type');
      expect(mockServiceError).toHaveBeenCalledWith(UnsupportedFormat, { received: 'image/unsupported' });
    });

    test('Should save image correctly', async () => {
      const getHeader = jest.fn();
      getHeader.mockReturnValueOnce('image/png').mockReturnValue('inline; filename="test-image.min.png";');
      const headers = { get: getHeader };
      const response = { ok: true, headers, body: 'some ReadableStream' };
      fetchSpy.mockResolvedValue(response);
      const hashStream = { update: jest.fn(), digest: jest.fn() };
      mockCreateHash.mockReturnValue(hashStream);
      const splitterStream = { numberOfways: 2 };
      mockTransform.mockReturnValue(splitterStream);
      mockMkdirSync.mockReturnValue();
      const randomUuid = '0000-0000';
      mockRandomUUID.mockReturnValue(randomUuid);
      const writeStream = { type: 'the end of the road' };
      mockCreateWriteStream.mockReturnValue(writeStream);
      mockPipeline.mockResolvedValue();
      const md5 = '112345679081239dafe';
      hashStream.digest.mockReturnValue(md5);
      mockRenameSync.mockReturnValue();

      const output = await fileClient.downloadImage(url);
      expect(output).toEqual({ path: `/output/test-image.min/original/${md5}.png`, md5 });
      expect(getHeader).toHaveBeenCalledTimes(2);
      expect(getHeader).toHaveBeenNthCalledWith(1, 'content-type');
      expect(getHeader).toHaveBeenNthCalledWith(2, 'content-disposition');
      expect(mockCreateHash).toHaveBeenCalledWith('md5', { encoding: 'binary' });
      expect(mockTransform).toHaveBeenCalledWith({ transform: expect.any(Function) });
      expect(mockMkdirSync).toHaveBeenCalledTimes(2);
      expect(mockMkdirSync).toHaveBeenNthCalledWith(1, '/output/tmp', { recursive: true });
      expect(mockMkdirSync).toHaveBeenNthCalledWith(2, '/output/test-image.min/original', { recursive: true });
      expect(mockCreateWriteStream).toHaveBeenCalledWith(`/output/tmp/${randomUuid}`, { encoding: 'binary' });
      expect(mockPipeline).toHaveBeenCalledWith(response.body, splitterStream, writeStream);
      expect(hashStream.digest).toHaveBeenCalledWith('hex');
      expect(mockRenameSync).toHaveBeenCalledWith(`/output/tmp/${randomUuid}`, `/output/test-image.min/original/${md5}.png`);
    });

    test('Should generate a random name if not provided', async () => {
      const getHeader = jest.fn();
      getHeader.mockReturnValueOnce('image/jpeg').mockReturnValue();
      const headers = { get: getHeader };
      const response = { ok: true, headers, body: 'some ReadableStream' };
      fetchSpy.mockResolvedValue(response);
      const hashStream = { update: jest.fn(), digest: jest.fn() };
      mockCreateHash.mockReturnValue(hashStream);
      const splitterStream = { numberOfways: 2 };
      mockTransform.mockReturnValue(splitterStream);
      mockMkdirSync.mockReturnValue();
      const randomUuid = '0000-0000';
      mockRandomUUID.mockReturnValue(randomUuid);
      const writeStream = { type: 'the end of the road' };
      mockCreateWriteStream.mockReturnValue(writeStream);
      mockPipeline.mockResolvedValue();
      const md5 = '112345679081239dafe';
      hashStream.digest.mockReturnValue(md5);
      mockRenameSync.mockReturnValue();

      const output = await fileClient.downloadImage(url);
      expect(output).toEqual({ path: `/output/auto-generated-name-${randomUuid}/original/${md5}.jpg`, md5 });
      expect(mockMkdirSync).toHaveBeenCalledTimes(2);
      expect(mockMkdirSync).toHaveBeenNthCalledWith(1, '/output/tmp', { recursive: true });
      expect(mockMkdirSync).toHaveBeenNthCalledWith(2, `/output/auto-generated-name-${randomUuid}/original`, { recursive: true });
      expect(mockRenameSync).toHaveBeenCalledWith(`/output/tmp/${randomUuid}`, `/output/auto-generated-name-${randomUuid}/original/${md5}.jpg`);
    });

    test('Should also feed chunks to the hash in the transform', async () => {
      // Preparation
      const getHeader = jest.fn();
      getHeader.mockReturnValueOnce('image/png').mockReturnValue('inline; filename="test-image.min.png";');
      const headers = { get: getHeader };
      const response = { ok: true, headers, body: 'some ReadableStream' };
      fetchSpy.mockResolvedValue(response);
      const hashStream = { update: jest.fn(), digest: jest.fn() };
      mockCreateHash.mockReturnValue(hashStream);
      mockMkdirSync.mockReturnValue();
      const randomUuid = '0000-0000';
      mockRandomUUID.mockReturnValue(randomUuid);
      const writeStream = { type: 'the end of the road' };
      mockCreateWriteStream.mockReturnValue(writeStream);
      mockPipeline.mockResolvedValue();
      const md5 = '112345679081239dafe';
      hashStream.digest.mockReturnValue(md5);
      mockRenameSync.mockReturnValue();

      // The actual test case
      let transformCallback;
      const splitterStream = { numberOfways: 2 };
      mockTransform.mockImplementation(({ transform }) => {
        transformCallback = transform;
        return splitterStream;
      });
      await fileClient.downloadImage(url);
      const chunk = 'q3wrcln.cr4awn';
      const encoding = 'binary';
      const callback = jest.fn();

      const output = transformCallback(chunk, encoding, callback);
      expect(output).toBeUndefined();
      expect(hashStream.update).toHaveBeenCalledWith(chunk);
      expect(callback).toHaveBeenCalledWith(null, chunk);
    });
  });

  describe('saveImageFromBuffer', () => {
    const buffer = { mocked: 'buffer' };
    const imgName = 'test-name';
    const imgExtension = 'png';
    const resolution = 4096;

    test('Should create read stream from buffer and save it as file', async () => {
      const mockReadable = { type: 'Readable but mocked' };
      mockReadableFrom.mockReturnValue(mockReadable);
      const hashStream = { update: jest.fn(), digest: jest.fn() };
      mockCreateHash.mockReturnValue(hashStream);
      const splitterStream = { numberOfways: 2 };
      mockTransform.mockReturnValue(splitterStream);
      mockMkdirSync.mockReturnValue();
      const randomUuid = '0000-0000';
      mockRandomUUID.mockReturnValue(randomUuid);
      const writeStream = { type: 'the end of the road' };
      mockCreateWriteStream.mockReturnValue(writeStream);
      mockPipeline.mockResolvedValue();
      const md5 = '112345679081239dafe';
      hashStream.digest.mockReturnValue(md5);
      mockRenameSync.mockReturnValue();

      const output = await fileClient.saveImageFromBuffer(buffer, imgName, imgExtension, resolution);
      expect(output).toEqual({ md5, path: `/output/${imgName}/${resolution}/${md5}.${imgExtension}` });
    });
  });

  describe('findImage', () => {
    const path = '/test/path';

    test('Should return true if file was found', () => {
      mockAccessSync.mockReturnValue();

      const response = fileClient.findImage(path);
      expect(response).toEqual(true);
    });

    test('Should return false if file was missing', () => {
      mockAccessSync.mockImplementation(() => { throw new Error('No file'); });

      const response = fileClient.findImage(path);
      expect(response).toEqual(false);
    });
  });
});
