import mongoose from 'mongoose';

const connectDB = async(username,password) => {
    const URL = `mongodb+srv://${username}:${password}@cluster7.rszdf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster7`
    try{
        await mongoose.connect(URL ,{ useUnifiedTopology: true, useNewUrlParser: true });
        console.log('Database Connected successfully');
    }
    catch(error){
       console.log(`Error while connecting with database `,error.message);
    }
};

export default connectDB;