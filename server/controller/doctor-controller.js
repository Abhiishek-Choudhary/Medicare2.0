
import Doctor from '../model/DoctorSchema.js'
import Image from '../model/ImageSchema.js'

export const getDoctor = async(request,response) => {
    try{
      const doctor = await Doctor.find({});

      response.status(200).json(doctor);
    }catch(error){
        response.status(500).json({ message: error.message });
    }
}

// controller/doctorController.js
//dynamic doctors

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Image.find();
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

//Doctor login
export const DoctorLogin = async (request, response) => {
  try {
    const { name,email } = request.body;
    const doctor = await Image.findOne({ name, email });

    if(doctor){
      // Return user data (omit sensitive info like password)
      const DoctorData = {
        _id: doctor._id,
        name: doctor.name,  // Make sure your User model has a 'name' field
        email: doctor.email,
        speciality: doctor.speciality,
        fee: doctor.fee,
        imageUrl: doctor.imageUrl, 
      };
      return response.status(200).json({ success: true, data: DoctorData });
    } else {
      return response.status(401).json({ success: false, message: 'Invalid Login' });
    }
  } catch (error) {
    return response.status(500).json({ success: false, message: error.message });
  }
};


//get docotrs with Id
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Image.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ data: doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ message: "Server error" });
  }
};

