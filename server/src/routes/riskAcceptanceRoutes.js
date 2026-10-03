import express from "express";

import {
  createRiskAcceptance,
  getRiskAcceptances,
  revokeRiskAcceptance,
} from "../controllers/remediationController.js";

const router = express.Router();

router.post(
  "/",
  createRiskAcceptance
);

router.get(
  "/",
  getRiskAcceptances
);

router.post(
  "/:id/revoke",
  revokeRiskAcceptance
);

export default router;