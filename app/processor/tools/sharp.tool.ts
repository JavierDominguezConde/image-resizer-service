import sharp from 'sharp';
import { ServiceError } from '../../core/error/handler.ts';
import { SharpError } from '../../core/config/error.config.ts';

export const resizeImage = async (path: string, width: number) => {
  try {
    const buffer = await sharp(path).resize({ width }).toBuffer();
    return buffer;
  } catch (err) {
    console.log(err);
    throw new ServiceError(SharpError, { path, width });
  }
};

export const getImageBuffer = async (path: string) => {
  try {
    return await sharp(path).toBuffer();
  } catch (err) {
    console.log(err);
    throw new ServiceError(SharpError, { path });
  }
};
