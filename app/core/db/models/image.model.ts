import { Schema, model } from 'mongoose';

const imageSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
      index: true
    },
    resolution: {
      type: String,
      required: true,
      index: true
    },
    md5: {
      type: String,
      required: true
    },
    relatedTaskId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const imageModel = model('image', imageSchema);

export default imageModel;
