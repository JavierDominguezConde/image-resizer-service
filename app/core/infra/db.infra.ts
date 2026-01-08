import mongoose, { type Mongoose, type ConnectOptions } from 'mongoose';

export const initDb = async (url: string, options: ConnectOptions): Promise<Mongoose> => {
  return await mongoose.connect(url, options);
};
