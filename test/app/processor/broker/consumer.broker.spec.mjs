import { describe, expect, jest, test } from '@jest/globals';
import SCHEMAS from '../../../../app/core/const/schema.const';

jest.spyOn(console, 'log').mockImplementation();

const mockProcessTask = jest.fn();
jest.unstable_mockModule('../../../../app/processor/domain/task.domain.ts', () => ({ processTask: mockProcessTask }));

const mockValidate = jest.fn();
jest.unstable_mockModule('../../../../app/core/validator/schema.validator.ts', () => ({ validate: mockValidate }));

const { handleMessage } = await import('../../../../app/processor/broker/consumer.broker.ts');

describe('Broker consumer', () => {
  describe('handleMessage', () => {
    test('Should not throw error if message is not json', async () => {
      const message = 'not-json';

      const response = await handleMessage(message);
      expect(response).toBeUndefined();
      expect(mockValidate).not.toHaveBeenCalled();
      expect(mockProcessTask).not.toHaveBeenCalled();
    });

    test('Should not throw if validation failed', async () => {
      const content = { some: 'invalid-info' };
      const message = JSON.stringify(content);
      const error = new Error('Validation failed');
      mockValidate.mockImplementation(() => { throw error; });

      const response = await handleMessage(message);
      expect(response).toBeUndefined();
      expect(mockValidate).toHaveBeenCalledWith(content, SCHEMAS.PROCESS_TASK);
      expect(mockProcessTask).not.toHaveBeenCalled();
    });

    test('Should process task if message is valid', async () => {
      const content = { some: 'valid-info' };
      const message = JSON.stringify(content);
      const taskId = 'test-id';
      mockValidate.mockReturnValue({ taskId });
      mockProcessTask.mockResolvedValue();

      const response = await handleMessage(message);
      expect(response).toBeUndefined();
      expect(mockValidate).toHaveBeenCalledWith(content, SCHEMAS.PROCESS_TASK);
      expect(mockProcessTask).toHaveBeenCalledWith(taskId);
    });

    test('Should not throw even if processing failed', async () => {
      const content = { some: 'valid-info' };
      const message = JSON.stringify(content);
      const taskId = 'test-id';
      mockValidate.mockReturnValue({ taskId });
      const error = new Error('Processing failed');
      mockProcessTask.mockRejectedValue(error);

      const response = await handleMessage(message);
      expect(response).toBeUndefined();
      expect(mockValidate).toHaveBeenCalledWith(content, SCHEMAS.PROCESS_TASK);
      expect(mockProcessTask).toHaveBeenCalledWith(taskId);
    });
  });
});
