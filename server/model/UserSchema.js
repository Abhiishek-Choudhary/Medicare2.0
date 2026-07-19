import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        max:20
    },
    email:{
        type:String,
        required:true,
        unique: true,
    },
    password:{
        type:String,
        required:true
    },
    phone: {
        type: String,
    },
    role: {
        type: String,
        enum: ['customer', 'pharmacist', 'admin', 'hospital'],
        default: 'customer',
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const user = mongoose.model('user', userSchema);

export default user;