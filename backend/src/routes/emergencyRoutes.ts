import express from "express";
import {
  activateEmergency,
  addAmbulance,
  getAmbulances,
} from "../controllers/emergencyController";

const router = express.Router();

router.post("/", activateEmergency);
router.post("/addambulance", addAmbulance);
router.post("/getambulances", getAmbulances);

export default router;
