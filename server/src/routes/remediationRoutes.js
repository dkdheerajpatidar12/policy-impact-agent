import express from "express";

import {
  createRemediation,
  getRemediations,
  updateRemediation,
  approveRemediation,
} from "../controllers/remediationController.js";

const router = express.Router();

router.post(
  "/",
  createRemediation
);

router.get(
  "/",
  getRemediations
);

router.put(
  "/:id",
  updateRemediation
);

router.post(
  "/:id/approve",
  approveRemediation
);

export default router;