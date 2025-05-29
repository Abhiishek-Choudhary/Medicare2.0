// models/Image.js
import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    speciality: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Make email unique if necessary
    },
    imageUrl: {
      type: String,
      required: true,
    },
    fee: {
      type: Number
    }
  },
  { timestamps: true }
);

const Image = mongoose.model('Image', imageSchema);

export default Image;
