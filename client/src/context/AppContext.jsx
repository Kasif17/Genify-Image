import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [credit, setCredit] = useState(0);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadCreditsData();
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);


  const loadCreditsData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/credits`);
      console.log("Credits API response:", data);

      if (data.success) {
        setCredit(data.credits);
        setUser(data.user);
      } else {
        toast.error(data.msg || "Failed to fetch credits");
      }
    } catch (error) {
      console.log("Credits API error:", error.response?.data || error.message);
      toast.error(error.response?.data?.msg || error.message);
    }
  };

 const generateImage = async (prompt) => {
  try {
    const response = await axios.post(
      backendUrl + '/api/image/generate-image',
      { prompt },
      { headers: { token } }
    );

    const data = response.data; 

    if (data.success) {  
      loadCreditsData();
      return data.resultImage;
    } else {
      toast.error(data.message || "Failed to generate image");
      loadCreditsData();
      if (data.creditBalance === 0) navigate('/buy');
    }
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
  }
};



  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setCredit(0);
  };

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    credit,
    setCredit,
    loadCreditsData,
    logout,
    generateImage
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;


// import { createContext, useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import axios from 'axios'

// export const AppContext = createContext();

// const AppContextProvider = (props)=>{
//     const [user, setUser] = useState(null);
//     const [showLogin ,setShowLogin] = useState(false);
//     const [token,setToken] = useState(localStorage.getItem('token'))

//     const [credit, setCredit] = useState(false)

//     const backendUrl = import.meta.env.VITE_BACKEND_URL
//    const loadCreditsData = async ()=>{
//     try {
//         const {data} = await axios.get(backendUrl + '/api/user/credits',{
//             headers:{ Authorization: `Bearer ${token}` }
//         })
//         console.log("Credits API response:", data);
//         if(data.success){
//             setCredit(data.credits);
//             setUser(data.user);
//         }
//     } catch (error) {
//         console.log("Credits API error:", error.response?.data || error.message);
//         toast.error(error.response?.data?.message || error.message);   
//     }
// }


//     const logout = ()=>{
//        localStorage.removeItem('token')
//        setToken('')
//        setUser(null)
//     }

//     useEffect(()=>{
//     if(token){
//       loadCreditsData();
//     }
//     },[token])

//     const value = {
//         user, setUser ,showLogin ,setShowLogin,backendUrl,token,setToken, credit, setCredit , loadCreditsData,logout
//     }


//     return (
//         <AppContext.Provider value={value}>
//               {props.children}
//         </AppContext.Provider>
//     )
// }

// export default AppContextProvider