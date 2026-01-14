import dotenv from "dotenv";
dotenv.config();

import express from "express";
import loyaltyRoutes from "./src/routes/loyalty.routes";

const app = express();
app.use(express.json());

app.use('/api/loyalty', loyaltyRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});