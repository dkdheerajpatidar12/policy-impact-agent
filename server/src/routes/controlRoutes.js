import express from "express";

import {
  createControl,
  getControls,
  getControlById,
  updateControl,
} from "../controllers/controlController.js";


const router =
  express.Router();


router.post(
  "/",
  createControl
);


router.get(
  "/",
  getControls
);


router.get(
  "/:id",
  getControlById
);


router.put(
  "/:id",
  updateControl
);


export default router;