import mongoose from 'mongoose';

const connectDB = async () => {
    console.log('Connecting to database...');
    console.log(process.env.DB_USERNAME, process.env.DB_PASSWORD); // Debugging: Check if env vars are loaded
    const URL = `mongodb+srv://Abhishek:sanket@cluster7.3i691zi.mongodb.net/medicare?retryWrites=true&w=majority`;
    try {
        await mongoose.connect(URL);
        console.log('Database Connected successfully');
    } catch (error) {
        console.log('Error while connecting with database:', error.message);
    }
};

export default connectDB;