"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emergencyRoutes_1 = __importDefault(require("./routes/emergencyRoutes"));
require("dotenv/config");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const emergencyController_1 = require("./controllers/emergencyController");
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use("/api/emergency", emergencyRoutes_1.default);
const PORT = process.env.PORT || 3000;
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
(0, emergencyController_1.initializeSocketIO)(io);
httpServer.listen(3001);
app.listen(PORT, () => {
    console.log(`> Server is running on port ${PORT}`);
});
