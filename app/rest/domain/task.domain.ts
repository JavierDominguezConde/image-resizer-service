import { sendMessage } from '../../core/client/broker.client.ts';
import taskStorage from '../../core/db/task.db.ts';
import imageStorage from '../../core/db/image.db.ts';
import { RESIZER_TOPIC } from '../../core/const/broker.const.ts';
import type { TaskApplication, TaskSummary } from '../../core/types.ts';

const createTask: TaskApplication['createTask'] = async (taskRequest): Promise<TaskSummary> => {
  // Arbitrary calculation of the task price, a number between 5 and 50
  const price = Math.round(Math.random() * 450 + 50) / 10;
  const { origin, createdAt, updatedAt, ...taskSummary } = await taskStorage.saveNewTask(taskRequest, price);
  await sendMessage({ taskId: taskSummary.taskId }, RESIZER_TOPIC);
  return taskSummary;
};

const getTaskById: TaskApplication['getTaskById'] = async (taskId): Promise<TaskSummary> => {
  const { origin, createdAt, updatedAt, ...taskSummary } = await taskStorage.getTask(taskId);
  const images = await imageStorage.findTaskImages(taskId);
  const imagesList = images.length ? images.map(i => ({ resolution: i.resolution, path: i.path })) : undefined;
  return { ...taskSummary, images: imagesList };
};

const taskApp: TaskApplication = { createTask, getTaskById };
export default taskApp;
