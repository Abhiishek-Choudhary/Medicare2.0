import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import Routes from './routes/route.js';
import connectDB from './db/db.js';
import DefaultData from './default.js';
import path from 'path'

dotenv.config();
const app = express();

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

DefaultData();

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/', Routes);

connectDB(username,password);

const PORT = 8000;

app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));