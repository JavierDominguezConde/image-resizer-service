import fs from 'node:fs';
import crypto from 'node:crypto';
import { Transform, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ServiceError } from '../../core/error/handler.ts';
import { FetchError, NotImageError, UnsupportedFormat } from '../../core/config/error.config.ts';

const _getImgName = (contentDisposition: string) => {
  const REGEX = /filename="(.*)".*/;
  const output = REGEX.exec(contentDisposition);
  const imgName = output?.[1];
  if (imgName) {
    return imgName.substring(0, imgName.lastIndexOf('.'));
  }
  return `auto-generated-name-${crypto.randomUUID()}`;
};

const _saveImgWithMd5 = async (inputStream: ReadableStream | Readable, imageName: string, imageExtension: string, resolution: string = 'original') => {
  const hashStream = crypto.createHash('md5', { encoding: 'binary' });
  const splitterStream = new Transform({
    transform: (chunk, _encoding, callback) => {
      if (chunk) {
        hashStream.update(chunk);
      }
      callback(null, chunk);
    }
  });
  fs.mkdirSync('/output/tmp', { recursive: true });
  const tmpImgPath = `/output/tmp/${crypto.randomUUID()}`;
  const writeStream = fs.createWriteStream(tmpImgPath, { encoding: 'binary' });
  await pipeline(inputStream, splitterStream, writeStream);
  const imageMd5 = hashStream.digest('hex');
  const imagePath = `/output/${imageName}/${resolution}/${imageMd5}.${imageExtension}`;
  fs.mkdirSync(imagePath.substring(0, imagePath.lastIndexOf('/')), { recursive: true });
  fs.renameSync(tmpImgPath, imagePath);
  return { path: imagePath, md5: imageMd5 };
};

const _getImgExtension = (contentType: string) => {
  let extension;
  switch (contentType) {
    case 'image/jpeg':
      extension = 'jpg';
      break;
    case 'image/png':
      extension = 'png';
      break;
    default:
      throw new ServiceError(UnsupportedFormat, { received: contentType });
  }
  return extension;
};

export const downloadImage = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ServiceError(FetchError, { url });
  }
  const headers = response.headers;
  console.log(headers);
  const contentType = headers.get('content-type');
  if (contentType && contentType.includes('image') && response.body) {
    const extension = _getImgExtension(contentType);
    const imageName = _getImgName(headers.get('content-disposition') || '');
    return await _saveImgWithMd5(response.body, imageName, extension);
  } else {
    throw new ServiceError(NotImageError, { contentType });
  }
};

export const saveImageFromBuffer = async (buffer: Buffer, imgName: string, imgExtension: string, resolution: number | string) => {
  const readable = Readable.from(buffer, { objectMode: false });
  return await _saveImgWithMd5(readable, imgName, imgExtension, resolution.toString());
};

export const findImage = (path: string) => {
  try {
    fs.accessSync(path);
    return true;
  } catch (err) {
    return false;
  }
};

