import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import youtubeRoutes from "./routes/youtube.routes.js";
import { initializeDatabase } from "./db/db.connection.js";


const app = express();
const PORT = 4000;

initializeDatabase();

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true              
}));

app.use(express.json());
app.use(cookieParser()); 

app.use("/", youtubeRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
