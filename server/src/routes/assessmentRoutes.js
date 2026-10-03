import express from "express";

import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  compareAssessmentPolicies,
  getAssessmentChanges,
  runImpactMapping,
getImpactMappings,
acceptImpactMapping,
rejectImpactMapping,
correctImpactMapping,
getAssessmentMetrics,
} from "../controllers/assessmentController.js";

const router = express.Router();


router.post(
  "/",
  createAssessment
);

router.post(
  "/:id/map-impacts",
  runImpactMapping
);

router.get(
  "/:id/mappings",
  getImpactMappings
);
router.get(
  "/",
  getAssessments
);

router.post(
  "/:id/compare",
  compareAssessmentPolicies
);

router.get(
  "/:id/changes",
  getAssessmentChanges
);

router.post(
  "/mappings/:mappingId/accept",
  acceptImpactMapping
);

router.post(
  "/mappings/:mappingId/reject",
  rejectImpactMapping
);

router.put(
  "/mappings/:mappingId/correct",
  correctImpactMapping
);

router.get(
  "/:id/metrics",
  getAssessmentMetrics
);

router.get(
  "/:id",
  getAssessmentById
);

export default router;