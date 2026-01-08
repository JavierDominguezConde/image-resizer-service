import type { RequestHandler } from 'express';
import { status } from 'http-status';
import taskApp from '../../domain/task.domain.ts';
import type { TaskRequest, TaskSummary } from '../../../core/types.ts';

export const createTask: RequestHandler<{}, TaskSummary, TaskRequest> = async (req, res, _next) => {
  try {
    const taskSummary = await taskApp.createTask(req.body);
    res.status(status.CREATED).send(taskSummary);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const getTaskById: RequestHandler<{ taskId: string }, TaskSummary> = async (req, res, _next) => {
  const taskSummary = await taskApp.getTaskById(req.params.taskId);
  res.send(taskSummary);
};
