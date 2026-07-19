
import Doctor from '../model/DoctorSchema.js'
import Image from '../model/ImageSchema.js'
import Hospital from '../model/HospitalSchema.js'

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
    const { hospitalId, q, speciality } = req.query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (speciality) filter.speciality = { $regex: speciality, $options: 'i' };

    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId).select('affiliatedDoctorIds');
      if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
      filter._id = { $in: hospital.affiliatedDoctorIds };
    }

    const doctors = await Image.find(filter);
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

//Doctor login
export const DoctorLogin = async (request, response) => {
  try {
    const { email, password } = request.body;

    console.log('Doctor login attempt — email:', email, '| password received:', password ? 'yes' : 'NO');

    if (!email || !password) {
      return response.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const doctorByEmail = await Image.findOne({ email });
    console.log('Doctor found by email:', doctorByEmail ? doctorByEmail.name : 'NOT FOUND');
    console.log('Stored password:', doctorByEmail?.password ?? 'MISSING (registered before password was added)');

    if (!doctorByEmail) {
      return response.status(401).json({ success: false, message: 'No doctor account found with this email.' });
    }

    if (doctorByEmail.password !== password) {
      return response.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const DoctorData = {
      _id: doctorByEmail._id,
      name: doctorByEmail.name,
      email: doctorByEmail.email,
      speciality: doctorByEmail.speciality,
      fee: doctorByEmail.fee,
      imageUrl: doctorByEmail.imageUrl,
    };
    return response.status(200).json({ success: true, data: DoctorData });

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

