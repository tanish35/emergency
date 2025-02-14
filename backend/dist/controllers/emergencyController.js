"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmbulances = exports.addAmbulance = exports.activateEmergency = exports.initializeSocketIO = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const axios_1 = __importDefault(require("axios"));
const turf = __importStar(require("@turf/turf"));
let io;
const initializeSocketIO = (socketIO) => {
    io = socketIO;
};
exports.initializeSocketIO = initializeSocketIO;
const ORS_API_KEY = process.env.ORS_API_KEY || "";
exports.activateEmergency = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () { }));
exports.addAmbulance = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        res.status(400);
        throw new Error("Please provide latitude and longitude");
    }
    yield prisma_1.default.$executeRaw `
        INSERT INTO "Ambulance" ("ambulanceId", location)
        VALUES (
          gen_random_uuid(),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude})::geography, 4326)
        )
      `;
    const result = yield prisma_1.default.$queryRaw `
        SELECT 
          "ambulanceId", 
          ST_X(location::geometry) as longitude, 
          ST_Y(location::geometry) as latitude,
          "createdAt",
          "updatedAt"
        FROM "Ambulance"
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;
    if (result.length === 0) {
        res.status(404);
        throw new Error("Failed to retrieve the newly added ambulance");
    }
    const newAmbulance = result[0];
    res.status(201).json({
        message: "Ambulance added successfully",
        ambulance: newAmbulance,
    });
}));
const simulateAmbulanceMovement = (coordinates, ambulanceId, speed) => {
    const reversedCoordinates = coordinates.slice().reverse();
    const route = turf.lineString(reversedCoordinates);
    const totalDistance = turf.length(route, { units: "kilometers" });
    const duration = (totalDistance / speed) * 3600;
    let elapsedTime = 0;
    const movementInterval = setInterval(() => {
        if (elapsedTime >= duration) {
            clearInterval(movementInterval);
            io.emit("ambulanceArrived", { ambulanceId });
            return;
        }
        const distanceTraveled = (elapsedTime / duration) * totalDistance;
        const currentPosition = turf.along(route, distanceTraveled, {
            units: "kilometers",
        });
        io.emit("ambulanceLocation", {
            ambulanceId,
            latitude: currentPosition.geometry.coordinates[1],
            longitude: currentPosition.geometry.coordinates[0],
        });
        elapsedTime += 1;
    }, 1000);
};
exports.getAmbulances = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        res.status(400);
        throw new Error("Please provide latitude and longitude");
    }
    const nearestAmbulances = yield prisma_1.default.$queryRaw `
        SELECT 
          "ambulanceId",
          ST_Distance(location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude})::geography, 4326)) AS distance,
          ST_Y(location::geometry) as latitude,
          ST_X(location::geometry) as longitude
        FROM "Ambulance"
        ORDER BY location <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude})::geography, 4326)
        LIMIT 10
      `;
    if (nearestAmbulances.length === 0) {
        res.status(404);
        throw new Error("No ambulances found");
    }
    const nearestAmbulance = nearestAmbulances[0];
    const routeResponse = yield axios_1.default.get("https://api.openrouteservice.org/v2/directions/driving-car", {
        params: {
            api_key: ORS_API_KEY,
            start: `${longitude},${latitude}`,
            end: `${nearestAmbulance.longitude},${nearestAmbulance.latitude}`,
        },
    });
    const route = routeResponse.data.features[0];
    const distance = route.properties.segments[0].distance;
    const duration = route.properties.segments[0].duration;
    const coordinates = route.geometry.coordinates;
    simulateAmbulanceMovement(coordinates, nearestAmbulance.ambulanceId, 60);
    res.status(200).json({
        message: "Nearest ambulance and route retrieved successfully",
        ambulance: nearestAmbulance,
        route: {
            distance: distance,
            duration: duration,
            eta: new Date(Date.now() + duration * 1000).toISOString(),
            geometry: route.geometry,
        },
    });
}));
