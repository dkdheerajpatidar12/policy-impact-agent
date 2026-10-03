import Remediation from "../models/Remediation.js";
import RiskAcceptance from "../models/RiskAcceptance.js";
import ImpactMapping from "../models/ImpactMapping.js";
import {
  recordAudit,
} from "../services/auditService.js";

// ======================================================
// CREATE REMEDIATION
// ======================================================

export const createRemediation = async (req, res) => {
  try {
    const {
      mappingId,
      title,
      description,
      owner,
      dueDate = null,
      priority = "medium",
    } = req.body;

    if (
      !mappingId ||
      !title ||
      !description ||
      !owner
    ) {
      return res.status(400).json({
        success: false,
        message:
          "mappingId, title, description and owner are required.",
      });
    }

    const mapping =
      await ImpactMapping.findById(mappingId);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: "Impact mapping not found.",
      });
    }

    if (
      mapping.impactStatus !== "confirmed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only confirmed impacts can have remediation actions.",
      });
    }

    const remediation =
      await Remediation.create({
        assessment:
          mapping.assessment,

        impactMapping:
          mapping._id,

        title,
        description,
        owner,
        dueDate,
        priority,
      });

    return res.status(201).json({
      success: true,
      message:
        "Remediation created successfully.",
      remediation,
    });

  } catch (error) {
    console.error(
      "Create remediation error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A remediation already exists for this impact.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create remediation.",
    });
  }
};


// ======================================================
// GET REMEDIATIONS
// ======================================================

export const getRemediations = async (
  req,
  res
) => {
  try {
    const filter = {};

    if (req.query.assessmentId) {
      filter.assessment =
        req.query.assessmentId;
    }

    const remediations =
      await Remediation.find(filter)
        .populate({
          path: "impactMapping",
          populate: [
            {
              path: "control",
            },
            {
              path: "requirementChange",
            },
          ],
        })
        .populate(
          "assessment",
          "name status"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: remediations.length,
      remediations,
    });

  } catch (error) {
    console.error(
      "Get remediations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch remediations.",
    });
  }
};


// ======================================================
// UPDATE REMEDIATION
// ======================================================

export const updateRemediation = async (
  req,
  res
) => {
  try {
    const remediation =
      await Remediation.findById(
        req.params.id
      );

    if (!remediation) {
      return res.status(404).json({
        success: false,
        message:
          "Remediation not found.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "owner",
      "status",
      "dueDate",
      "priority",
    ];

    for (const field of allowedFields) {
      if (
        req.body[field] !== undefined
      ) {
        remediation[field] =
          req.body[field];
      }
    }

    if (
      remediation.status ===
      "completed"
    ) {
      remediation.completedAt =
        remediation.completedAt ||
        new Date();
    } else {
      remediation.completedAt =
        null;
    }

    await remediation.save();

    return res.status(200).json({
      success: true,
      message:
        "Remediation updated successfully.",
      remediation,
    });

  } catch (error) {
    console.error(
      "Update remediation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update remediation.",
    });
  }
};


// ======================================================
// APPROVE REMEDIATION
// ======================================================

export const approveRemediation = async (
  req,
  res
) => {
  try {
    const remediation =
      await Remediation.findById(
        req.params.id
      );

    if (!remediation) {
      return res.status(404).json({
        success: false,
        message:
          "Remediation not found.",
      });
    }

    remediation.approved = true;

    remediation.approvedBy =
      req.body.approvedBy ||
      "Reviewer";

    remediation.approvedAt =
      new Date();

    await remediation.save();

    return res.status(200).json({
      success: true,
      message:
        "Remediation approved.",
      remediation,
    });

  } catch (error) {
    console.error(
      "Approve remediation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve remediation.",
    });
  }
};


// ======================================================
// CREATE RISK ACCEPTANCE
// ======================================================

export const createRiskAcceptance = async (
  req,
  res
) => {
  try {
    const {
      mappingId,
      reason,
      reviewDate,
      acceptedBy = "Reviewer",
    } = req.body;

    if (
      !mappingId ||
      !reason ||
      !reviewDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "mappingId, reason and reviewDate are required.",
      });
    }

    const mapping =
      await ImpactMapping.findById(
        mappingId
      );

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message:
          "Impact mapping not found.",
      });
    }

    if (
      mapping.impactStatus !==
      "confirmed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Risk can only be accepted for a confirmed impact.",
      });
    }

    const review =
      new Date(reviewDate);

    if (
      Number.isNaN(
        review.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid review date.",
      });
    }

    if (review <= new Date()) {
      return res.status(400).json({
        success: false,
        message:
          "Review date must be in the future.",
      });
    }

    const riskAcceptance =
      await RiskAcceptance.create({
        assessment:
          mapping.assessment,

        impactMapping:
          mapping._id,

        reason,

        reviewDate:
          review,

        acceptedBy,
      });

    return res.status(201).json({
      success: true,
      message:
        "Risk accepted successfully.",
      riskAcceptance,
    });

  } catch (error) {
    console.error(
      "Create risk acceptance error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Risk acceptance already exists for this impact.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create risk acceptance.",
    });
  }
};


// ======================================================
// GET RISK ACCEPTANCES
// ======================================================

export const getRiskAcceptances = async (
  req,
  res
) => {
  try {
    const filter = {};

    if (req.query.assessmentId) {
      filter.assessment =
        req.query.assessmentId;
    }

    const risks =
      await RiskAcceptance.find(
        filter
      )
        .populate({
          path: "impactMapping",
          populate: [
            {
              path: "control",
            },
            {
              path: "requirementChange",
            },
          ],
        })
        .populate(
          "assessment",
          "name status"
        )
        .sort({
          createdAt: -1,
        });

    const now = new Date();

    for (const risk of risks) {
      if (
        risk.status === "active" &&
        risk.reviewDate < now
      ) {
        risk.status = "expired";
        await risk.save();
      }
    }

    return res.status(200).json({
      success: true,
      count: risks.length,
      risks,
    });

  } catch (error) {
    console.error(
      "Get risk acceptances error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch risk acceptances.",
    });
  }
};


// ======================================================
// REVOKE RISK ACCEPTANCE
// ======================================================

export const revokeRiskAcceptance = async (
  req,
  res
) => {
  try {
    const risk =
      await RiskAcceptance.findById(
        req.params.id
      );

    if (!risk) {
      return res.status(404).json({
        success: false,
        message:
          "Risk acceptance not found.",
      });
    }

    risk.status = "revoked";

    await risk.save();

    return res.status(200).json({
      success: true,
      message:
        "Risk acceptance revoked.",
      risk,
    });

  } catch (error) {
    console.error(
      "Revoke risk acceptance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to revoke risk acceptance.",
    });
  }
};