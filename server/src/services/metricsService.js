import RequirementChange from "../models/RequirementChange.js";
import ImpactMapping from "../models/ImpactMapping.js";
import Remediation from "../models/Remediation.js";
import RiskAcceptance from "../models/RiskAcceptance.js";


export const calculateAssessmentMetrics = async (
  assessmentId
) => {

  const [
    changes,
    mappings,
    remediations,
    riskAcceptances,
  ] = await Promise.all([

    RequirementChange.find({
      assessment: assessmentId,
    }),

    ImpactMapping.find({
      assessment: assessmentId,
    }),

    Remediation.find({
      assessment: assessmentId,
    }),

    RiskAcceptance.find({
      assessment: assessmentId,
    }),

  ]);


  // ================================================
  // MAPPED REQUIREMENTS
  // ================================================

  const mappedRequirementIds =
    new Set(
      mappings
        .filter((mapping) =>
          [
            "accepted",
            "corrected",
          ].includes(
            mapping.reviewerDecision
          )
        )
        .map((mapping) =>
          String(
            mapping.requirementChange
          )
        )
    );


  const mapped =
    mappedRequirementIds.size;


  const unmapped =
    Math.max(
      changes.length - mapped,
      0
    );


  // ================================================
  // CONFIRMED IMPACTS
  // ================================================

  const confirmedMappings =
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
  // COMPLIANT / UNRESOLVED
  // ================================================

  let compliant = 0;
  let unresolved = 0;
  let riskAccepted = 0;


  const now = new Date();


  for (
    const mapping
    of confirmedMappings
  ) {

    const remediation =
      remediations.find(
        (item) =>
          String(
            item.impactMapping
          ) ===
          String(mapping._id)
      );


    const riskAcceptance =
      riskAcceptances.find(
        (item) =>
          String(
            item.impactMapping
          ) ===
            String(mapping._id) &&
          item.status ===
            "active" &&
          new Date(
            item.reviewDate
          ) > now
      );


    if (
      remediation?.status ===
      "completed"
    ) {

      compliant++;

      continue;
    }


    if (riskAcceptance) {

      riskAccepted++;

      continue;
    }


    unresolved++;
  }


  // ================================================
  // PENDING AI MAPPINGS
  // ================================================

  const pendingReview =
    mappings.filter(
      (mapping) =>
        mapping.reviewerDecision ===
        "pending"
    ).length;


  return {

    totalChanges:
      changes.length,

    totalMappings:
      mappings.length,

    mapped,

    unmapped,

    compliant,

    unresolved,

    riskAccepted,

    pendingReview,

    confirmedImpacts:
      confirmedMappings.length,

  };
};