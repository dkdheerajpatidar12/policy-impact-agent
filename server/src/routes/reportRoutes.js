import express from "express";

import {
  getImpactReport,
} from "../controllers/reportController.js";


const router =
  express.Router();


router.get(
  "/:id",
  getImpactReport
);


export default router;