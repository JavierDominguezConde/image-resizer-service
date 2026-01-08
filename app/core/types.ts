/* Utility types */

type Prettify<T> = { [k in keyof T]: T[k] };

/* Global types */

export type TaskStatus = 'pending' | 'completed' | 'failed';

export type ResizerError<T extends string = string> = {
  code: T;
  message: string;
  data?: any;
};

/* User-input interface types */

export type ImageSummary = {
  resolution: string;
  path: string;
};

export type TaskSummary = {
  taskId: string;
  status: TaskStatus;
  price: number;
  images?: Array<ImageSummary>;
  error?: ResizerError;
};

export type TaskRequest =
  | {
      path: string;
    }
  | {
      url: string;
    };

export type TaskApplication = {
  /**
   * Creates and queues a task to generate images of different resolution from the one specified in the request.
   * The request must contain either a local path, or the url from the image.
   */
  createTask: (taskRequest: TaskRequest) => Promise<TaskSummary>;

  /**
   * Retrieves the state of the task given its id.
   */
  getTaskById: (taskId: string) => Promise<TaskSummary>;
};

/* Storage interface types */

export type ImageOrigin = TaskRequest;

export type Image = Prettify<
  ImageSummary & {
    md5: string;
    relatedTaskId: string;
    createdAt: Date;
    updatedAt: Date;
  }
>;

export type Task = Prettify<
  TaskSummary & {
    origin: ImageOrigin;
    createdAt: Date;
    updatedAt: Date;
  }
>;

export type TaskUpdate = {
  status: TaskStatus;
  error?: ResizerError;
};

export type TaskStorage = {
  /**
   * Generates a task entry in the task collection, and persists it.
   */
  saveNewTask: (origin: ImageOrigin, price: number) => Promise<Task>;

  /**
   * Updates a task in storage given its id, and the content to update.
   */
  updateTask: (taskId: string, update: TaskUpdate) => Promise<Task>;

  /**
   * Finds a task in storage given its id.
   */
  getTask: (taskId: string) => Promise<Task>;
};

export type ImageStorage = {
  /**
   * Generates an image entry in the image collection, and persists it.
   */
  saveImage: (path: string, md5: string, relatedTaskId: string, resolution?: string) => Promise<Image>;

  /**
   * Finds an image in storage given its path.
   */
  getImage: (path: string) => Promise<Image>;

  /**
   * Finds all images related to a specific task.
   */
  findTaskImages: (taskId: string) => Promise<Array<Image>>;
};
