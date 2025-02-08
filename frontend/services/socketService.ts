import { io, Socket } from "socket.io-client";

export const connectToSocket = (
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void
) => {
  const socket = io("http://192.168.29.99:3000", { transports: ["websocket"] });
  socket.on("locationUpdate", (newLocation) => {
    onLocationUpdate(newLocation);
  });
  return socket;
};
