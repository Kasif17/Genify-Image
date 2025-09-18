import jwt from "jsonwebtoken";
import userModel from "../models/user.js";

const userAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await userModel.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ success: false, msg: "User not found" });
      }

      next();
    } catch (error) {
      console.error("Auth Error:", error);
      return res.status(401).json({ success: false, msg: "Token invalid or expired" });
    }
  } else {
    return res.status(401).json({ success: false, msg: "No token provided" });
  }
};

export default userAuth;


// this is video 
// import jwt from 'jsonwebtoken';

// const userAuth = async (req, res, next) => {
//   const { token } = req.headers;

//   if (!token) {
//     return res.json({ success: false, message: 'Not Authorized. Login Again' });
//   }

//   try {
//     const tokenDecode = jwt.verify(token);
//     if (tokenDecode.id) {
//       req.body.userID = tokenDecode.id;
//     } else {
//       return res.json({ success: false, message: 'Not Authorized. Login Again' });
//     }

//     next();
//   } catch (error) {
//     return res.json({ success: false, message: 'Not Authorized. Login Again' });
//   }
// };
