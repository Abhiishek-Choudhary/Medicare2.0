import { doctors } from "./constants/data.js";
import Doctor from "./model/DoctorSchema.js";

const DefaultData = async() => {
    try{
      await Doctor.insertMany(doctors);
      console.log('Doctor inserted succesfully');
    }catch(error){
        console.log(`Error while inserting default data `,error.message);
    }
}

export default DefaultData;