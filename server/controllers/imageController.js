import userModel from '../models/user.js';
import FormData from 'form-data';
import axios from 'axios';

export const generateImage = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Use authenticated user
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, msg: "Prompt is required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    if (user.creditBalance <= 0) {
      return res.json({ success: false, msg: "No Credit balance", creditBalance: user.creditBalance });
    }
    // Prepare form data
    const formData = new FormData();
    formData.append('prompt', prompt);

    const { data } = await axios.post(
      'https://clipdrop-api.co/text-to-image/v1',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': process.env.CLIPDROP_API,
        },
        responseType: 'arraybuffer',
      }
    );

    // Convert to Base64
    const base64Image = Buffer.from(data, 'binary').toString('base64');
    const resultImage = `data:image/png;base64,${base64Image}`;

    // Decrement credits & get updated user
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $inc: { creditBalance: -1 } },
      { new: true }
    );

    res.json({
      success: true,
      msg: "Image Generated",
      creditBalance: updatedUser.creditBalance, // ✅ correct balance
      resultImage,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ success: false, msg: "Server error, try again later" });
  }
};



// import userModel from '../models/user.js';
// import FormData from 'form-data'
// import axios from 'axios'


// export const generateImage = async (req,res)=>{
//     try {
//         const {userId,prompt} = req.body;
//         const user = await userModel.findById(userId);

//         if(!user || !prompt){
//             return res.json({success:false, msg:"Missing Details"})
//         }
//         if(user.creditBalance === 0 || userModel.creditBalance <0){
//             return res.json({success:false, msg:"No Credit balance",creditBalance:user.creditBalance})
//         }

//         const formData = new FormData()
//         formData.append('prompt',prompt)

//        const {data} =  await axios.post('https://clipdrop-api.co/text-to-image/v1',formData,{
//             headers: {
//                 'x-api-key': process.env.CLIPDROP_API,
//              },
//              responseType:'arraybuffer'
//         })

//         const based64Image = Buffer.from(data,'binary').toString('base64')

//         const resultImage = `data:image/png;based64,${based64Image}`

//         await userModel.findByIdAndUpdate(user._id,{creditBalance:user.creditBalance-1})

//         res.json({success:true, msg:"Image Generated",creditBalance:user.creditBalance-1,resultImage})

//     } catch (error)
//      {
//          console.error("Error fetching user Image generate:", error);
//          res.status(500).json({ success: false, msg: "Server error, try again later" });
//     }
// }