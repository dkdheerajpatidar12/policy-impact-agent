import Control from "../models/Control.js";

import {
  recordAudit,
} from "../services/auditService.js";

import {
  markAssessmentsStaleForControl,
} from "../services/staleAssessmentService.js";


// ======================================================
// CREATE CONTROL
// ======================================================

export const createControl = async (req, res) => {
  try {
    const {
      controlId,
      name,
      type = "control",
      description,
      owner,
      department = "",
      status = "active",
      evidence = [],
    } = req.body;


    if (
      !controlId ||
      !name ||
      !description ||
      !owner
    ) {
      return res.status(400).json({
        success: false,
        message:
          "controlId, name, description and owner are required.",
      });
    }


    const normalizedControlId =
      controlId.trim().toUpperCase();


    const existingControl =
      await Control.findOne({
        controlId: normalizedControlId,
      });


    if (existingControl) {
      return res.status(409).json({
        success: false,
        message:
          "A control with this ID already exists.",
      });
    }


    const control =
      await Control.create({
        controlId:
          normalizedControlId,

        name,
        type,
        description,
        owner,
        department,
        status,
        evidence,

        version: 1,

        lastChangedAt:
          new Date(),
      });


    await recordAudit({
      action:
        "CONTROL_CREATED",

      entityType:
        "Control",

      entityId:
        control._id,

      actor:
        "Reviewer",

      summary:
        `${control.controlId} created.`,

      after:
        control.toObject(),
    });


    return res.status(201).json({
      success: true,
      message:
        "Control created successfully.",
      control,
    });

  } catch (error) {
    console.error(
      "Create control error:",
      error
    );


    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A control with this ID already exists.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "Failed to create control.",
    });
  }
};


// ======================================================
// GET ALL CONTROLS
// ======================================================

export const getControls = async (req, res) => {
  try {
    const controls =
      await Control.find()
        .sort({
          controlId: 1,
        });


    return res.status(200).json({
      success: true,
      count:
        controls.length,
      controls,
    });

  } catch (error) {
    console.error(
      "Get controls error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch controls.",
    });
  }
};


// ======================================================
// GET ONE CONTROL
// ======================================================

export const getControlById = async (
  req,
  res
) => {
  try {
    const control =
      await Control.findById(
        req.params.id
      );


    if (!control) {
      return res.status(404).json({
        success: false,
        message:
          "Control not found.",
      });
    }


    return res.status(200).json({
      success: true,
      control,
    });

  } catch (error) {
    console.error(
      "Get control error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch control.",
    });
  }
};


// ======================================================
// UPDATE CONTROL
// ======================================================

export const updateControl = async (
  req,
  res
) => {
  try {
    const control =
      await Control.findById(
        req.params.id
      );


    if (!control) {
      return res.status(404).json({
        success: false,
        message:
          "Control not found.",
      });
    }


    const before =
      control.toObject();


    const allowedFields = [
      "name",
      "type",
      "description",
      "owner",
      "department",
      "status",
      "evidence",
    ];


    let changed = false;


    for (const field of allowedFields) {
      if (
        req.body[field] !== undefined
      ) {
        const oldValue =
          JSON.stringify(
            control[field]
          );

        const newValue =
          JSON.stringify(
            req.body[field]
          );


        if (oldValue !== newValue) {
          control[field] =
            req.body[field];

          changed = true;
        }
      }
    }


    if (!changed) {
      return res.status(200).json({
        success: true,
        message:
          "No control changes detected.",
        staleAssessments: 0,
        control,
      });
    }


    control.version =
      (control.version || 1) + 1;


    control.lastChangedAt =
      new Date();


    control.lastReviewedAt =
      new Date();


    await control.save();


    const staleCount =
      await markAssessmentsStaleForControl(
        control
      );


    await recordAudit({
      action:
        "CONTROL_UPDATED",

      entityType:
        "Control",

      entityId:
        control._id,

      actor:
        req.body.updatedBy ||
        "Reviewer",

      summary:
        `${control.controlId} updated to version ${control.version}.`,

      before,

      after:
        control.toObject(),

      metadata: {
        staleAssessments:
          staleCount,
      },
    });


    return res.status(200).json({
      success: true,

      message:
        "Control updated successfully.",

      staleAssessments:
        staleCount,

      control,
    });

  } catch (error) {
    console.error(
      "Update control error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to update control.",
    });
  }
};