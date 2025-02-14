import asyncHandler from "express-async-handler";
import prisma from "../lib/prisma";
import { Request, Response } from "express";
import axios from "axios";

interface Ambulance {
  ambulanceId: string;
  longitude: number;
  latitude: number;
  createdAt: Date;
  updatedAt: Date;
}

const ORS_API_KEY = process.env.ORS_API_KEY || "";

export const activateEmergency = asyncHandler(
  async (req: Request, res: Response) => {}
);

export const addAmbulance = asyncHandler(
  async (req: Request, res: Response) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      res.status(400);
      throw new Error("Please provide latitude and longitude");
    }
    await prisma.$executeRaw`
        INSERT INTO "Ambulance" ("ambulanceId", location)
        VALUES (
          gen_random_uuid(),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude})::geography, 4326)
        )
      `;
    const result = await prisma.$queryRaw<Ambulance[]>`
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
  }
);

export const getAmbulances = asyncHandler(
  async (req: Request, res: Response) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      res.status(400);
      throw new Error("Please provide latitude and longitude");
    }
    const nearestAmbulances = await prisma.$queryRaw<Ambulance[]>`
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

    const routeResponse = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          api_key: ORS_API_KEY,
          start: `${longitude},${latitude}`,
          end: `${nearestAmbulance.longitude},${nearestAmbulance.latitude}`,
        },
      }
    );

    const route = routeResponse.data.features[0];
    const distance = route.properties.segments[0].distance;
    const duration = route.properties.segments[0].duration;

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
  }
);
