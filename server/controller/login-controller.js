import User from "../model/UserSchema.js";
import Image from "../model/ImageSchema.js";

export const userSignUp = async (request, response) => {
  try {
    const exsit = await User.findOne({ username: request.body.username });
    if (exsit) {
      return response.status(401).json({ message: "User already exists" });
    }
    const user = request.body;
    const newUser = new User(user);
    await newUser.save();
    response.status(200).json({ mesage: user });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};


export const userLogin = async (request, response) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email, password });

    if(user){
      // Return user data (omit sensitive info like password)
      const userData = {
        id: user._id,
        name: user.name,  // Make sure your User model has a 'name' field
        email: user.email,
      };
      return response.status(200).json({ success: true, data: userData });
    } else {
      return response.status(401).json({ success: false, message: 'Invalid Login' });
    }
  } catch (error) {
    return response.status(500).json({ success: false, message: error.message });
  }
};

