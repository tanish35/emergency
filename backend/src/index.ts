import express from "express";
import emergencyRoutes from "./routes/emergencyRoutes";
import "dotenv/config";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/emergency", emergencyRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`> Server is running on port ${PORT}`);
});
