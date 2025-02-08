import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server);

let ambulanceLocation = { latitude: 28.6139, longitude: 77.209 };

setInterval(() => {
  ambulanceLocation.latitude += (Math.random() - 0.5) * 0.002;
  ambulanceLocation.longitude += (Math.random() - 0.5) * 0.002;
  io.emit("locationUpdate", ambulanceLocation);
  console.log("Updated Location:", ambulanceLocation);
}, 1000);

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("locationUpdate", ambulanceLocation);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("WebSocket server is running!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
