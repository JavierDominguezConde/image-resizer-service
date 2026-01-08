import ImageModel from './models/image.model.ts';
import { ServiceError } from '../error/handler.ts';
import { ImageNotFoundError, StorageError } from '../config/error.config.ts';
import type { ImageStorage } from '../types.ts';

const saveImage = async (path: string, md5: string, relatedTaskId: string, resolution: string = 'original') => {
  try {
    const response = await ImageModel.create({ path, md5, relatedTaskId, resolution });
    const { _id, __v, ...newImage } = response.toObject();
    return newImage;
  } catch (err) {
    console.log(err);
    throw new ServiceError(StorageError, { path, md5, relatedTaskId, resolution });
  }
};

const getImage = async (path: string) => {
  try {
    const image = await ImageModel.findOne({ path }, { _id: 0, __v: 0 }, { lean: true });
    if (!image) {
      throw new ServiceError(ImageNotFoundError, { path });
    }
    return image;
  } catch (err) {
    if (err instanceof ServiceError) {
      throw err;
    }
    console.log(err);
    throw new ServiceError(StorageError, { path });
  }
};

const findTaskImages = async (taskId: string) => {
  try {
    return await ImageModel.find({ relatedTaskId: taskId }, { _id: 0, __v: 0 }, { lean: true });
  } catch (err) {
    console.log(err);
    throw new ServiceError(StorageError, { taskId });
  }
};

const imageStorage: ImageStorage = { saveImage, getImage, findTaskImages };
export default imageStorage;
