import Assessment from "../models/Assessment.js";
import RequirementChange from "../models/RequirementChange.js";
import ImpactMapping from "../models/ImpactMapping.js";
import Remediation from "../models/Remediation.js";
import RiskAcceptance from "../models/RiskAcceptance.js";

import {
  calculateAssessmentMetrics,
} from "../services/metricsService.js";


// ======================================================
// GET FINAL IMPACT REPORT
// ======================================================

export const getImpactReport = async (
  req,
  res
) => {
  try {
    const assessmentId =
      req.params.id;


    const assessment =
      await Assessment.findById(
        assessmentId
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


    const [
      changes,
      mappings,
      remediations,
      riskAcceptances,
      metrics,
    ] = await Promise.all([

      RequirementChange.find({
        assessment:
          assessmentId,
      }).sort({
        createdAt: 1,
      }),


      ImpactMapping.find({
        assessment:
          assessmentId,
      })
        .populate(
          "requirementChange"
        )
        .populate(
          "control"
        )
        .sort({
          createdAt: 1,
        }),


      Remediation.find({
        assessment:
          assessmentId,
      })
        .populate({
          path:
            "impactMapping",

          populate: [
            {
              path:
                "control",
            },

            {
              path:
                "requirementChange",
            },
          ],
        }),


      RiskAcceptance.find({
        assessment:
          assessmentId,
      })
        .populate({
          path:
            "impactMapping",

          populate: [
            {
              path:
                "control",
            },

            {
              path:
                "requirementChange",
            },
          ],
        }),


      calculateAssessmentMetrics(
        assessmentId
      ),

    ]);


    // ================================================
    // CONFIRMED IMPACTS
    // ================================================

    const confirmedImpacts =
      mappings.filter(
        (mapping) =>
          mapping.impactStatus ===
            "confirmed" &&
          [
            "accepted",
            "corrected",
          ].includes(
            mapping.reviewerDecision
          )
      );


    // ================================================
    // REJECTED IMPACTS
    // ================================================

    const rejectedImpacts =
      mappings.filter(
        (mapping) =>
          mapping.reviewerDecision ===
          "rejected"
      );


    // ================================================
    // PENDING REVIEW
    // ================================================

    const pendingImpacts =
      mappings.filter(
        (mapping) =>
          mapping.reviewerDecision ===
          "pending"
      );


    // ================================================
    // UNMAPPED REQUIREMENTS
    // ================================================

    const mappedRequirementIds =
      new Set(
        confirmedImpacts.map(
          (mapping) =>
            String(
              mapping.requirementChange
                ?._id ||
              mapping.requirementChange
            )
        )
      );


    const unmappedRequirements =
      changes.filter(
        (change) =>
          !mappedRequirementIds.has(
            String(change._id)
          )
      );


    // ================================================
    // REPORT READINESS
    // ================================================

    const reportStatus =
      pendingImpacts.length > 0
        ? "review_pending"
        : "reviewed";


    const report = {
      generatedAt:
        new Date(),

      status:
        reportStatus,

      assessment,

      metrics,

      changes,

      confirmedImpacts,

      rejectedImpacts,

      pendingImpacts,

      unmappedRequirements,

      remediations,

      riskAcceptances,

      disclaimer:
        "This tool assesses impact only against the supplied policy and does not provide formal compliance certification.",
    };


    return res.status(200).json({
      success: true,
      report,
    });

  } catch (error) {
    console.error(
      "Generate report error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to generate impact report.",
    });
  }
};