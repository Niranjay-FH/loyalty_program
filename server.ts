import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from 'cors';
import loyaltyRoutes from "./src/routes/loyalty.routes";
import basketRoutes from "./src/routes/basket.routes";

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/basket', basketRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});