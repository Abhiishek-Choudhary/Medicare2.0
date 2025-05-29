import Image from "../model/ImageSchema.js"; // Assuming you have an Image model to save the data

export const uploadImage = async (req, res) => {
  try {
    // Extracting text fields and file
    const { name, speciality, email, fee } = req.body; // Make sure `name`, `speciality`, and `email` are in `req.body`

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Validate that required fields are provided
    if (!name || !speciality || !email || !fee) {
      return res
        .status(400)
        .json({ error: "Missing required fields (name, speciality, email)." });
    }

    // Construct image URL (adjust this based on your file upload setup)
    const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;

    // Create a new image document in MongoDB
    const newImage = new Image({
      name,
      speciality,
      email,
      fee,
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
