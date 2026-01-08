import crypto from 'node:crypto';
import { downloadImage, findImage, saveImageFromBuffer } from '../client/file.client.ts';
import taskStorage from '../../core/db/task.db.ts';
import imageStorage from '../../core/db/image.db.ts';
import { ServiceError } from '../../core/error/handler.ts';
import { ImageFileMissing } from '../../core/config/error.config.ts';
import { STATUS } from '../../core/const/status.const.ts';
import type { Task } from '../../core/types.ts';
import { resizeImage, getImageBuffer } from '../tools/sharp.tool.ts';

const _getOriginalImage = async (task: Task) => {
  if ('url' in task.origin) {
    // We need to download the image and register it in db
    const { path, md5 } = await downloadImage(task.origin.url);
    await imageStorage.saveImage(path, md5, task.taskId);
    return { path, name: path.split('/')[2], extension: path.split('.').at(-1) as string };
  } else {
    // We need to make sure the image exists. To avoid collisions, a new copy will be created and registered in db
    const newName = `image-copy-${crypto.randomUUID()}`;
    const extension = task.origin.path.split('.').at(-1) as string;
    if (findImage(task.origin.path)) {
      const buffer = await getImageBuffer(task.origin.path);
      const { path, md5 } = await saveImageFromBuffer(buffer, newName, extension, 'original');
      await imageStorage.saveImage(path, md5, task.taskId);
      return { path, name: newName, extension };
    } else {
      throw new ServiceError(ImageFileMissing, { path: task.origin.path });
    }

  }
};

export const processTask = async (taskId: string): Promise<void> => {
  let task;
  try {
    task = await taskStorage.getTask(taskId);
    if (task.status !== STATUS.PENDING) {
      // The message should not have been sent to the consumer
      return;
    }
    const { path, name, extension } = await _getOriginalImage(task);
    for (const width of [1024, 800]) {
      const buffer = await resizeImage(path, width);
      const { path: newPath, md5 } = await saveImageFromBuffer(buffer, name, extension, width);
      await imageStorage.saveImage(newPath, md5, taskId, width.toString());
    }
    await taskStorage.updateTask(taskId, { status: STATUS.COMPLETED });
  } catch (err) {
    // Log the error and try to update task state, but not throw in any case
    const parsedErr = err as ServiceError;
    console.log(`Failed task ${taskId}:`, parsedErr);
    if (task) {
      await taskStorage.updateTask(
        taskId,
        { status: STATUS.FAILED, error: { ...parsedErr, message: parsedErr.message } }
      ).catch(err => console.log(err));
    }
  }
};
