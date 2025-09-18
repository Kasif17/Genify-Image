import mongoose from "mongoose";

const mongoDB  = async ()=>{
    try {
       await mongoose.connect(process.env.MONGO_URL || "mongodb+srv://developer786kasif:9794975553@cluster0.ch2lmha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
       console.log("DB connected Successfully");
       
    } catch (error) {
         console.error("❌ MongoDB Connection Failed:", error.message);
         process.exit(1);
    }
}

export default mongoDB;
