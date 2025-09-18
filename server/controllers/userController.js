import userModel from "../models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export const registerUser = async (req,res)=>{
    try {
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.status(401).json({success:false,msg:"Missing Credantials"})
        }

         const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const userData = {
            name,
            email,
            password:hashedPassword
        }
        const newUser = new userModel(userData)

        const user = await newUser.save();
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
      expiresIn: "7d", 
    })

        res.status(200).json({success:true,token,user:{name: user.name}})
    } catch (error) {
        console.log(error);
        res.status(403).json({success:false,message:error.message})
        
    }
}


export const loginUser = async (req,res)=>{
    try {
        const {email,password} = req.body;

        const user = await userModel.findOne({email})

        if(!user){
            return res.status(404).json({success:false, msg:"User not found"})
        }
        const isMatch = await bcrypt.compare(password,user.password)

        if(isMatch){
              const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
      expiresIn: "7d",
    })

              res.status(200).json({success:true,token,user:{name: user.name}})
        }else{
            return res.status(404).json({success:false, msg:"Invalid Credentials"})
        }

    } catch (error) {
        console.log(error);
        res.status(403).json({success:false,msg:error.message})
    }
}

export const userCredits = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name },
    });

  } catch (error) {
    console.error("Error fetching user credits:", error);
    res.status(500).json({ success: false, msg: "Server error, try again later" });
  }
};
