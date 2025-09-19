import userModel from "../models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay'
import transactionModel from "../models/transactionModel.js";


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


const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const paymentRazorpay = async (req, res) => {
  try {
    // ✅ Get userId from auth middleware
    const userId = req.user?.id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: "Plan ID is required" });
    }

    // ✅ Validate user
    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let credits = 0,
      amount = 0,
      plan = "";

    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;
      case "Advance":
        plan = "Advance";
        credits = 500;
        amount = 50;
        break;
      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;
      default:
        return res.status(404).json({ success: false, message: "Plan Not Found" });
    }

    // ✅ Create transaction record in DB
    const newTransaction = await transactionModel.create({
      userId,
      plan,
      amount,
      credits,
      date: Date.now(),
      payment: false,
    });

    
    const options = {
      amount: amount * 100, 
      currency: process.env.CURRENCY || "INR",
      receipt: String(newTransaction._id),
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({ success: true, order });

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create order. Please try again later.",
      error: error.message,
    });
  }
};

export const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body; 

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      const transactionData = await transactionModel.findById(orderInfo.receipt);

      if (transactionData.payment) {
        return res.json({ success: false, message: "Payment already verified" });
      }

      const userData = await userModel.findById(transactionData.userId);
      const creditBalance = userData.creditBalance + transactionData.credits;

      await userModel.findByIdAndUpdate(userData._id, { creditBalance });
      await transactionModel.findByIdAndUpdate(transactionData._id, {
        payment: true,
      });

      res.json({ success: true, message: "Credits Added" });
    } else {
      res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};