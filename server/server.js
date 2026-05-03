import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import Routes from './routes/route.js';
import connectDB from './db/db.js';
import DefaultData from './default.js';
import path from 'path';

dotenv.config();
const app = express();

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/', Routes);

const PORT = 8000;

// ✅ FIXED FLOW
const startServer = async () => {
  try {
    await connectDB();        // 1. connect DB
    await DefaultData();      // 2. insert default data AFTER connection

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.log("Server start failed:", error);
  }
};

startServer();