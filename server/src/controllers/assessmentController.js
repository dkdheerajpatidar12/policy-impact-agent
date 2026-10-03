import Assessment from "../models/Assessment.js";
import Policy from "../models/Policy.js";
import Control from "../models/Control.js";
import RequirementChange from "../models/RequirementChange.js";
import ImpactMapping from "../models/ImpactMapping.js";

import {
  recordAudit,
} from "../services/auditService.js";

import {
  calculateAssessmentMetrics,
} from "../services/metricsService.js";

import {
  generateImpactMappings,
} from "../services/ai/impactMapper.js";

import {
  comparePolicySections,
} from "../services/policyComparisonService.js";


// ======================================================
// CREATE ASSESSMENT
// ======================================================

export const createAssessment = async (req, res) => {
  try {
    const {
      oldPolicyId,
      newPolicyId,
      createdBy = "Reviewer",
    } = req.body;


    if (!oldPolicyId || !newPolicyId) {
      return res.status(400).json({
        success: false,
        message:
          "Old policy and new policy are required.",
      });
    }


    if (
      String(oldPolicyId) ===
      String(newPolicyId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Old policy and new policy must be different versions.",
      });
    }


    const [
      oldPolicy,
      newPolicy,
    ] = await Promise.all([
      Policy.findById(oldPolicyId),
      Policy.findById(newPolicyId),
    ]);


    if (!oldPolicy || !newPolicy) {
      return res.status(404).json({
        success: false,
        message:
          "One or both policy versions were not found.",
      });
    }


    if (
      oldPolicy.name !==
      newPolicy.name
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please compare two versions of the same policy.",
      });
    }


    const controls =
      await Control.find().select(
        "_id controlId version"
      );


    const controlSnapshot =
      controls.map(
        (control) => ({
          control:
            control._id,

          controlId:
            control.controlId,

          version:
            control.version,
        })
      );


    const assessment =
      await Assessment.create({
        name:
          `${oldPolicy.name} v${oldPolicy.version} → v${newPolicy.version}`,

        oldPolicy:
          oldPolicy._id,

        newPolicy:
          newPolicy._id,

        oldPolicyVersion:
          oldPolicy.version,

        newPolicyVersion:
          newPolicy.version,

        controlSnapshot,

        status:
          "draft",

        createdBy,
      });


    await recordAudit({
      assessment:
        assessment._id,

      action:
        "ASSESSMENT_CREATED",

      entityType:
        "Assessment",

      entityId:
        assessment._id,

      actor:
        createdBy,

      summary:
        `Assessment created for ${oldPolicy.name} v${oldPolicy.version} → v${newPolicy.version}.`,

      after:
        assessment.toObject(),
    });


    return res.status(201).json({
      success: true,
      message:
        "Assessment created successfully.",
      assessment,
    });

  } catch (error) {
    console.error(
      "Create assessment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create assessment.",
    });
  }
};


// ======================================================
// GET ALL ASSESSMENTS
// ======================================================

export const getAssessments = async (
  req,
  res
) => {
  try {
    const assessments =
      await Assessment.find()

        .populate(
          "oldPolicy",
          "name version description"
        )

        .populate(
          "newPolicy",
          "name version description"
        )

        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      success: true,
      count:
        assessments.length,
      assessments,
    });

  } catch (error) {
    console.error(
      "Get assessments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch assessments.",
    });
  }
};


// ======================================================
// GET ONE ASSESSMENT
// ======================================================

export const getAssessmentById = async (
  req,
  res
) => {
  try {
    const assessment =
      await Assessment.findById(
        req.params.id
      )
        .populate("oldPolicy")
        .populate("newPolicy")
        .populate(
          "controlSnapshot.control"
        );


    if (!assessment) {
      return res.status(404).json({
        success: false,
        message:
          "Assessment not found.",
      });
    }


    return res.status(200).json({
      success: true,
      assessment,
    });

  } catch (error) {
    console.error(
      "Get assessment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch assessment.",
    });
  }
};


// ======================================================
// COMPARE POLICY VERSIONS
// ======================================================

export const compareAssessmentPolicies = async (
  req,
  res
) => {
  try {
    const assessment =
      await Assessment.findById(
        req.params.id
      )
        .populate("oldPolicy")
        .populate("newPolicy");


    if (!assessment) {
      return res.status(404).json({
        success: false,
        message:
          "Assessment not found.",
      });
    }


    assessment.status =
      "analyzing";

    assessment.analysisStartedAt =
      new Date();

    await assessment.save();


    const changes =
      comparePolicySections(
        assessment.oldPolicy.sections,
        assessment.newPolicy.sections
      );


    /*
      Remove previous deterministic requirement changes.

      During normal use, run comparison before reviewer
      decisions and remediation actions.
    */
    await RequirementChange.deleteMany({
      assessment:
        assessment._id,

      detectionMethod:
        "deterministic",
    });


    const changeDocuments =
      changes.map(
        (change) => ({
          assessment:
            assessment._id,

          ...change,

          detectionMethod:
            "deterministic",
        })
      );


    let savedChanges = [];


    if (
      changeDocuments.length > 0
    ) {
      savedChanges =
        await RequirementChange.insertMany(
          changeDocuments
        );
    }


    assessment.status =
      "in_review";

    /*
      Assessment model uses completedAt.
    */
    assessment.completedAt =
      new Date();

    await assessment.save();


    await recordAudit({
      assessment:
        assessment._id,

      action:
        "POLICY_COMPARISON_RUN",

      entityType:
        "Assessment",

      entityId:
        assessment._id,

      actor:
        assessment.createdBy ||
        "Reviewer",

      summary:
        `Policy comparison completed with ${savedChanges.length} detected changes.`,

      metadata: {
        changeCount:
          savedChanges.length,
      },
    });


    return res.status(200).json({
      success: true,

      message:
        "Policy comparison completed successfully.",

      count:
        savedChanges.length,

      changes:
        savedChanges,
    });

  } catch (error) {
    console.error(
      "Policy comparison error:",
      error
    );


    try {
      await Assessment.findByIdAndUpdate(
        req.params.id,
        {
          status:
            "failed",
        }
      );
    } catch {
      // Ignore secondary error
    }


    return res.status(500).json({
      success: false,
      message:
        "Failed to compare policy versions.",
    });
  }
};


// ======================================================
// GET REQUIREMENT CHANGES
// ======================================================

export const getAssessmentChanges = async (
  req,
  res
) => {
  try {
    const changes =
      await RequirementChange.find({
        assessment:
          req.params.id,
      }).sort({
        createdAt: 1,
      });


    return res.status(200).json({
      success: true,
      count:
        changes.length,
      changes,
    });

  } catch (error) {
    console.error(
      "Get requirement changes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch requirement changes.",
    });
  }
};


// ======================================================
// RUN AI IMPACT MAPPING
// ======================================================

export const runImpactMapping = async (
  req,
  res
) => {
  try {
    const assessment =
      await Assessment.findById(
        req.params.id
      );


    if (!assessment) {
      return res.status(404).json({
        success: false,
        message:
          "Assessment not found.",
      });
    }


    const changes =
      await RequirementChange.find({
        assessment:
          assessment._id,
      });


    if (
      changes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Run policy comparison before AI impact mapping.",
      });
    }


    const controls =
      await Control.find();


    if (
      controls.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No controls are available for impact mapping.",
      });
    }


    const aiResult =
      await generateImpactMappings({
        changes,
        controls,
      });


    /*
      Delete only pending AI suggestions.
      Accepted/corrected/rejected reviewer decisions
      must be preserved.
    */
    await ImpactMapping.deleteMany({
      assessment:
        assessment._id,

      mappingSource:
        "ai",

      reviewerDecision:
        "pending",
    });


    /*
      Existing reviewed mappings are preserved.
      We will not create duplicates for them.
    */
    const existingReviewedMappings =
      await ImpactMapping.find({
        assessment:
          assessment._id,

        reviewerDecision: {
          $ne:
            "pending",
        },
      });


    const existingPairSet =
      new Set(
        existingReviewedMappings.map(
          (mapping) =>
            `${String(
              mapping.requirementChange
            )}:${String(
              mapping.control
            )}`
        )
      );


    const changeMap =
      new Map(
        changes.map(
          (change) => [
            String(change._id),
            change,
          ]
        )
      );


    const controlMap =
      new Map(
        controls.map(
          (control) => [
            String(
              control.controlId
            ).toUpperCase(),
            control,
          ]
        )
      );


    const validMappings = [];

    const newPairSet =
      new Set();


    for (
      const suggestion of
      aiResult.mappings || []
    ) {
      const requirementChangeId =
        String(
          suggestion.requirementChangeId ||
          ""
        );


      const suggestedControlId =
        String(
          suggestion.controlId ||
          ""
        )
          .trim()
          .toUpperCase();


      const change =
        changeMap.get(
          requirementChangeId
        );


      const control =
        controlMap.get(
          suggestedControlId
        );


      // Reject hallucinated IDs
      if (
        !change ||
        !control
      ) {
        continue;
      }


      const pairKey =
        `${String(
          change._id
        )}:${String(
          control._id
        )}`;


      /*
        Prevent duplicates from both existing reviewed
        mappings and repeated Gemini suggestions.
      */
      if (
        existingPairSet.has(
          pairKey
        ) ||
        newPairSet.has(
          pairKey
        )
      ) {
        continue;
      }


      newPairSet.add(
        pairKey
      );


      validMappings.push({
        assessment:
          assessment._id,

        requirementChange:
          change._id,

        control:
          control._id,

        controlId:
          control.controlId,

        controlVersion:
          control.version,

        impactStatus:
          "possible",

        confidence:
          Math.min(
            1,
            Math.max(
              0,
              Number(
                suggestion.confidence
              ) || 0
            )
          ),

        explanation:
          suggestion.explanation ||
          "AI identified a possible relationship between this policy change and control.",

        missingContext:
          Array.isArray(
            suggestion.missingContext
          )
            ? suggestion.missingContext
            : [],

        evidenceReviewRequired:
          Boolean(
            suggestion
              .evidenceReviewRequired
          ),

        evidenceReviewReason:
          suggestion
            .evidenceReviewReason ||
          "",

        reviewerDecision:
          "pending",

        mappingSource:
          "ai",
      });
    }


    let savedMappings = [];


    if (
      validMappings.length > 0
    ) {
      savedMappings =
        await ImpactMapping.insertMany(
          validMappings,
          {
            ordered:
              false,
          }
        );
    }


    assessment.status =
      "in_review";

    await assessment.save();


    await recordAudit({
      assessment:
        assessment._id,

      action:
        "AI_MAPPING_RUN",

      entityType:
        "Assessment",

      entityId:
        assessment._id,

      actor:
        "AI Agent",

      summary:
        `AI impact mapping generated ${savedMappings.length} new suggestions.`,

      metadata: {
        generatedMappings:
          savedMappings.length,

        model:
          process.env.GEMINI_MODEL ||
          "gemini-3.8-flash",
      },
    });


    return res.status(200).json({
      success: true,

      message:
        "AI impact mapping completed.",

      count:
        savedMappings.length,

      mappings:
        savedMappings,
    });

  } catch (error) {
    console.error(
      "AI impact mapping error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "AI impact mapping failed.",
    });
  }
};


// ======================================================
// GET IMPACT MAPPINGS
// ======================================================

export const getImpactMappings = async (
  req,
  res
) => {
  try {
    const mappings =
      await ImpactMapping.find({
        assessment:
          req.params.id,
      })
        .populate(
          "requirementChange"
        )
        .populate(
          "control"
        )
        .sort({
          createdAt: 1,
        });


    return res.status(200).json({
      success: true,

      count:
        mappings.length,

      mappings,
    });

  } catch (error) {
    console.error(
      "Get mappings error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch impact mappings.",
    });
  }
};


// ======================================================
// ACCEPT IMPACT MAPPING
// ======================================================

export const acceptImpactMapping = async (
  req,
  res
) => {
  try {
    const mapping =
      await ImpactMapping.findById(
        req.params.mappingId
      );


    if (!mapping) {
      return res.status(404).json({
        success: false,
        message:
          "Impact mapping not found.",
      });
    }


    /*
      Capture the old value BEFORE making changes.
    */
    const before =
      mapping.toObject();


    mapping.reviewerDecision =
      "accepted";

    mapping.impactStatus =
      "confirmed";

    mapping.reviewedBy =
      req.body.reviewedBy ||
      "Reviewer";

    mapping.reviewerComment =
      req.body.reviewerComment ||
      "";

    mapping.reviewedAt =
      new Date();


    await mapping.save();


    await recordAudit({
      assessment:
        mapping.assessment,

      action:
        "MAPPING_ACCEPTED",

      entityType:
        "ImpactMapping",

      entityId:
        mapping._id,

      actor:
        mapping.reviewedBy,

      summary:
        `${mapping.controlId} impact mapping accepted by reviewer.`,

      before,

      after:
        mapping.toObject(),
    });


    return res.status(200).json({
      success: true,
      message:
        "Impact mapping accepted.",
      mapping,
    });

  } catch (error) {
    console.error(
      "Accept mapping error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to accept impact mapping.",
    });
  }
};


// ======================================================
// REJECT IMPACT MAPPING
// ======================================================

export const rejectImpactMapping = async (
  req,
  res
) => {
  try {
    const mapping =
      await ImpactMapping.findById(
        req.params.mappingId
      );


    if (!mapping) {
      return res.status(404).json({
        success: false,
        message:
          "Impact mapping not found.",
      });
    }


    /*
      Capture before state.
    */
    const before =
      mapping.toObject();


    mapping.reviewerDecision =
      "rejected";

    mapping.impactStatus =
      "not_affected";

    mapping.reviewedBy =
      req.body.reviewedBy ||
      "Reviewer";

    mapping.reviewerComment =
      req.body.reviewerComment ||
      "";

    mapping.reviewedAt =
      new Date();


    await mapping.save();


    await recordAudit({
      assessment:
        mapping.assessment,

      action:
        "MAPPING_REJECTED",

      entityType:
        "ImpactMapping",

      entityId:
        mapping._id,

      actor:
        mapping.reviewedBy,

      summary:
        `${mapping.controlId} impact mapping rejected by reviewer.`,

      before,

      after:
        mapping.toObject(),
    });


    return res.status(200).json({
      success: true,
      message:
        "Impact mapping rejected.",
      mapping,
    });

  } catch (error) {
    console.error(
      "Reject mapping error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to reject impact mapping.",
    });
  }
};


// ======================================================
// CORRECT IMPACT MAPPING
// ======================================================

export const correctImpactMapping = async (
  req,
  res
) => {
  try {
    const {
      controlId,
      explanation,
      reviewerComment = "",
      reviewedBy = "Reviewer",
    } = req.body;


    if (!controlId) {
      return res.status(400).json({
        success: false,
        message:
          "Correct controlId is required.",
      });
    }


    const mapping =
      await ImpactMapping.findById(
        req.params.mappingId
      );


    if (!mapping) {
      return res.status(404).json({
        success: false,
        message:
          "Impact mapping not found.",
      });
    }


    /*
      Capture old mapping BEFORE changing
      its control/explanation.
    */
    const before =
      mapping.toObject();


    const control =
      await Control.findOne({
        controlId:
          controlId
            .trim()
            .toUpperCase(),
      });


    if (!control) {
      return res.status(404).json({
        success: false,
        message:
          "Selected control not found.",
      });
    }


    /*
      Prevent a corrected mapping from creating a
      duplicate requirementChange + control combination.
    */
    const duplicateMapping =
      await ImpactMapping.findOne({
        _id: {
          $ne:
            mapping._id,
        },

        requirementChange:
          mapping.requirementChange,

        control:
          control._id,
      });


    if (duplicateMapping) {
      return res.status(409).json({
        success: false,
        message:
          "This requirement is already mapped to the selected control.",
      });
    }


    mapping.control =
      control._id;

    mapping.controlId =
      control.controlId;

    mapping.controlVersion =
      control.version;


    if (
      explanation &&
      explanation.trim()
    ) {
      mapping.explanation =
        explanation.trim();
    }


    mapping.reviewerDecision =
      "corrected";

    mapping.impactStatus =
      "confirmed";

    mapping.reviewedBy =
      reviewedBy;

    mapping.reviewerComment =
      reviewerComment;

    mapping.reviewedAt =
      new Date();

    mapping.mappingSource =
      "manual";


    await mapping.save();


    await recordAudit({
      assessment:
        mapping.assessment,

      action:
        "MAPPING_CORRECTED",

      entityType:
        "ImpactMapping",

      entityId:
        mapping._id,

      actor:
        mapping.reviewedBy,

      summary:
        `Impact mapping corrected to ${mapping.controlId}.`,

      before,

      after:
        mapping.toObject(),
    });


    return res.status(200).json({
      success: true,
      message:
        "Impact mapping corrected.",
      mapping,
    });

  } catch (error) {
    console.error(
      "Correct mapping error:",
      error
    );


    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This requirement is already mapped to the selected control.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "Failed to correct impact mapping.",
    });
  }
};


// ======================================================
// GET ASSESSMENT METRICS
// ======================================================

export const getAssessmentMetrics = async (
  req,
  res
) => {
  try {
    const assessment =
      await Assessment.findById(
        req.params.id
      );


    if (!assessment) {
      return res.status(404).json({
        success: false,
        message:
          "Assessment not found.",
      });
    }


    const metrics =
      await calculateAssessmentMetrics(
        assessment._id
      );


    return res.status(200).json({
      success: true,
      metrics,
    });

  } catch (error) {
    console.error(
      "Metrics error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to calculate assessment metrics.",
    });
  }
};
