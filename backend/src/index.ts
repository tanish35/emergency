import express from "express";
import emergencyRoutes from "./routes/emergencyRoutes";
import "dotenv/config";
import { Server } from "socket.io";
import { createServer } from "http";
import { initializeSocketIO } from "./controllers/emergencyController";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/emergency", emergencyRoutes);

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initializeSocketIO(io);

httpServer.listen(PORT, () => {
  console.log(`> Server is running on port ${PORT}`);
});
