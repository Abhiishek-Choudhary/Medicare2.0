import mongoose from "mongoose";

const DetailsSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    age: Number,
    gender: String,
    issues: String,
    radio: String,
    precription:String,
})

const Details = mongoose.model('details',DetailsSchema);

export default Details;