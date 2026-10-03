import express from "express";
import cors from "cors";

import policyRoutes from "./routes/policyRoutes.js";
import controlRoutes from "./routes/controlRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import remediationRoutes from "./routes/remediationRoutes.js";
import riskAcceptanceRoutes from "./routes/riskAcceptanceRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";


const app =
  express();


const allowedOrigin =
  process.env.CLIENT_URL ||
  "http://localhost:5173";


app.use(
  cors({
    origin:
      allowedOrigin,

    credentials:
      true,
  })
);


app.use(
  express.json({
    limit:
      "2mb",
  })
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Policy Impact API is running",
    });
  }
);


// ======================================================
// API ROUTES
// ======================================================

app.use(
  "/api/policies",
  policyRoutes
);


app.use(
  "/api/controls",
  controlRoutes
);


app.use(
  "/api/assessments",
  assessmentRoutes
);


app.use(
  "/api/remediations",
  remediationRoutes
);


app.use(
  "/api/risk-acceptances",
  riskAcceptanceRoutes
);


app.use(
  "/api/audit",
  auditRoutes
);


app.use(
  "/api/reports",
  reportRoutes
);


// ======================================================
// 404
// ======================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API route not found.",
    });
  }
);


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(error);

    res.status(
      error.status || 500
    ).json({
      success: false,

      message:
        error.message ||
        "Internal server error.",
    });
  }
);


export default app;