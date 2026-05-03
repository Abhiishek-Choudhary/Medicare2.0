import Image from "../model/ImageSchema.js"; // Assuming you have an Image model to save the data

export const uploadImage = async (req, res) => {
  try {
    // Extracting text fields and file
    const { name, speciality, email, fee, password } = req.body;

    if (!name || !speciality || !email || !fee || !password) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const imageUrl = req.file
      ? `http://localhost:8000/uploads/${req.file.filename}`
      : 'https://www.shutterstock.com/image-photo/profile-photo-attractive-family-doc-600nw-1724693776.jpg';

    const newImage = new Image({
      name,
      speciality,
      email,
      fee,
      password,
      imageUrl,
    });

    // Save the image document to MongoDB
    const savedDoctor = await newImage.save();
    return res.status(200).json({
      message: "File and data uploaded successfully!",
      doctor: savedDoctor, // This includes the unique _id MongoDB generates
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error uploading data" });
  }
};
