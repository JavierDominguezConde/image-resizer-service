import { Schema, model } from 'mongoose';
import { STATUS } from '../../const/status.const.ts';


const taskSchema = new Schema(
  {
    taskId: {
      type: String,
      required: true,
      index: true,
      unique: true
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.PENDING
    },
    origin: {
      type: {
        url: { type: String },
        path: { type: String }
      },
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    error: {
      type: {
        _id: false,
        code: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: Object }
      },
      required: false
    }
  },
  {
    timestamps: true
  }
);

const taskModel = model('task', taskSchema);

export default taskModel;
