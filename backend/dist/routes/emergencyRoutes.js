"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emergencyController_1 = require("../controllers/emergencyController");
const router = express_1.default.Router();
router.post("/", emergencyController_1.activateEmergency);
router.post("/addambulance", emergencyController_1.addAmbulance);
router.post("/getambulances", emergencyController_1.getAmbulances);
exports.default = router;
