import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server);

// Mock ambulance location
let ambulanceLocation = { latitude: 28.6139, longitude: 77.209 }; // Initial location (Delhi, India)

// Simulate ambulance movement
setInterval(() => {
  ambulanceLocation.latitude += (Math.random() - 0.5) * 0.002; // Small latitude change
  ambulanceLocation.longitude += (Math.random() - 0.5) * 0.002; // Small longitude change
  io.emit("locationUpdate", ambulanceLocation);
  console.log("Updated Location:", ambulanceLocation);
}, 1000);

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("locationUpdate", ambulanceLocation); // Send initial location

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Basic route for testing
app.get("/", (req: Request, res: Response) => {
  res.send("WebSocket server is running!");
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
