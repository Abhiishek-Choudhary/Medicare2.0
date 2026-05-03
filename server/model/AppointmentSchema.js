import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
    required: true,
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
  },
  customerEmail: {
    type: String
  },
  doctorName:{
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  fee: { 
    type: Number, 
  },
  paymentId: { 
    type: String
  },
  status: {
    type: String,
    default: 'scheduled', // 'scheduled', 'cancelled', 'rescheduled'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
