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
      default: 'https://www.shutterstock.com/image-photo/profile-photo-attractive-family-doc-600nw-1724693776.jpg',
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
  },
  { timestamps: true }
);

const Image = mongoose.model('Image', imageSchema);

export default Image;
