import Image from "../model/ImageSchema.js";
import Hospital from "../model/HospitalSchema.js";

// Resolve the hospital linkage for a doctor.
// Accepts an existing hospitalId, or a raw hospitalName (auto-creates a stub hospital).
// Returns { hospitalId, hospitalName } — both may be undefined if the doctor picked none.
const resolveHospital = async ({ hospitalId, hospitalName, city, state }) => {
  if (hospitalId) {
    const existing = await Hospital.findById(hospitalId);
    if (!existing) throw new Error('Selected hospital not found');
    return { hospital: existing, hospitalId: existing._id, hospitalName: existing.name };
  }

  const trimmed = (hospitalName || '').trim();
  if (!trimmed) return { hospital: null, hospitalId: undefined, hospitalName: undefined };

  // Try to reuse an existing hospital with the same name (case-insensitive)
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const dupe = await Hospital.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } });
  if (dupe) return { hospital: dupe, hospitalId: dupe._id, hospitalName: dupe.name };

  // Otherwise auto-create a stub hospital
  const created = await Hospital.create({
    name: trimmed,
    address: 'To be updated',
    city: city || 'N/A',
    state: state || 'N/A',
    phone: 'N/A',
    autoCreated: true,
  });
  return { hospital: created, hospitalId: created._id, hospitalName: created.name };
};

export const uploadImage = async (req, res) => {
  try {
    const {
      name, speciality, email, fee, password,
      hospitalId, hospitalName, city, state,
    } = req.body;

    if (!name || !speciality || !email || !fee || !password) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // If the doctor uploaded a photo, save its path. Otherwise leave empty so the
    // frontend DoctorAvatar renders a branded initials tile.
    const imageUrl = req.file
      ? `http://localhost:8000/uploads/${req.file.filename}`
      : '';

    let hospitalLink;
    try {
      hospitalLink = await resolveHospital({ hospitalId, hospitalName, city, state });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const newImage = new Image({
      name, speciality, email, fee, password, imageUrl,
      hospitalId: hospitalLink.hospitalId,
      hospitalName: hospitalLink.hospitalName,
    });

    const savedDoctor = await newImage.save();

    // Also register the doctor under the hospital's affiliated list for filtering
    if (hospitalLink.hospital) {
      await Hospital.updateOne(
        { _id: hospitalLink.hospital._id },
        { $addToSet: { affiliatedDoctorIds: savedDoctor._id } }
      );
    }

    return res.status(200).json({
      message: "File and data uploaded successfully!",
      doctor: savedDoctor,
      hospital: hospitalLink.hospital || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error uploading data" });
  }
};
