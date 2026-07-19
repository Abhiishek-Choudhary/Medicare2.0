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
      default: '',
    },
    fee: {
      type: Number
    },
    password: {
      type: String,
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    hospitalName: {
      type: String,
    },
  },
  { timestamps: true }
);

const Image = mongoose.model('Image', imageSchema);

export default Image;
