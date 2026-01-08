import TaskModel from './models/task.model.ts';
import { ServiceError } from '../error/handler.ts';
import { NotFoundError, StorageError } from '../config/error.config.ts';
import type { ImageOrigin, Task, TaskStorage, TaskUpdate } from '../types.ts';
import crypto from 'node:crypto';

const saveNewTask = async (origin: ImageOrigin, price: number): Promise<Task> => {
  try {
    const response = await TaskModel.create({ origin, price, taskId: crypto.randomUUID() });
    const { _id, __v, ...newTask } = response.toObject();
    return newTask as Task;
  } catch (err) {
    console.log(err);
    throw new ServiceError(StorageError, { origin, price });
  }
};

const updateTask = async (taskId: string, update: TaskUpdate): Promise<Task> => {
  try {
    const response = await TaskModel.findOneAndUpdate({ taskId }, update, { lean: true });
    if (!response) {
      throw new ServiceError(NotFoundError, { taskId });
    }
    const { _id, __v, ...task } = response;
    return task as Task;
  } catch (err) {
    if (err instanceof ServiceError) {
      throw err;
    }
    console.log(err);
    throw new ServiceError(StorageError, { taskId, update });
  }
};

const getTask = async (taskId: string): Promise<Task> => {
  try {
    const task = await TaskModel.findOne({ taskId }, { _id: 0, __v: 0 }, { lean: true });
    if (!task) {
      throw new ServiceError(NotFoundError, { taskId });
    }
    return task as Task;
  } catch (err) {
    if (err instanceof ServiceError) {
      throw err;
    }
    console.log(err);
    throw new ServiceError(StorageError, { taskId });
  }
};

const taskStorage: TaskStorage = { saveNewTask, updateTask, getTask };
export default taskStorage;
