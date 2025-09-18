import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoDB from './config/db.js';
import userRouter from './routes/userRoutes.js'

const app = express();
mongoDB();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/user',userRouter)
app.get('/', (req, res) => {
  res.send('API is Working Now!!!!');
});

app.listen(PORT,()=>{
    console.log(`Server is running on PORT ${PORT}`);
})
