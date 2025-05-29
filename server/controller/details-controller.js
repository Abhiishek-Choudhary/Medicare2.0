
import Details from '../model/DetailsSchema.js'

export const getUserDetails = async(request,response) => {
   try{
     const exsist = await Details.findOne({firstname: request.body.firstname})
     if(exsist){
        return response.status(401).json({message: "User Already exsists"});
     }
     const user = request.body;
     const newUser = new Details(user);
     await newUser.save();
     response.status(200).json({message: user});
   }catch(error){
      response.status(500).json({message: error.message});
   }
}

export const getUser = async(request,response) => {
   try{
      const user = await Details.find({});
      response.status(200).json(user);
   }
   catch(error){
      response.status(500).json({ message: error.message })
   }
}