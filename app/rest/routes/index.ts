import express from 'express';
import { createTask, getTaskById } from './controllers/task.controller.ts';
import { validateMiddleware } from './middlewares/validator.middleware.ts';
import { serviceErrorHandler } from '../../core/error/handler.ts';
import SCHEMAS from '../../core/const/schema.const.ts';

const router = express.Router();

router.post('/tasks', validateMiddleware('body', SCHEMAS.CREATE_TASK), createTask);

router.get('/tasks/:taskId', validateMiddleware('params', SCHEMAS.GET_TASK), getTaskById);

router.use(serviceErrorHandler);

export default router;
