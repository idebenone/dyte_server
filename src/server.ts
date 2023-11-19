import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import log from './Routes/logController';
import cors from 'cors'
import morgan from 'morgan'

const app: Express = express();
const PORT = 3001;

app.use(cors())
app.use(express.json());
app.use(morgan('dev'))

mongoose.connect('mongodb://localhost:27017/logs1Db')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use("/check", async (req: Request, res: Response) => {
    res.status(200).json("OK STATUS");
})
app.use('/', log)
