import mongoose from "mongoose";

const doctorSchema  = new mongoose.Schema({
    id:{
      type:String,
      required:true,
      unique:true,
    },
    url: String,
    title:String,
    category:String,
    fee:Number,
    time:Number,
    available:Boolean
});

const Doctor = mongoose.model('doctor', doctorSchema);

export default Doctor;