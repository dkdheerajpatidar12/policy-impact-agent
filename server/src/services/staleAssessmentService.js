import Assessment from "../models/Assessment.js";

import {
  recordAudit,
} from "./auditService.js";


export const markAssessmentsStaleForControl = async (
  control
) => {
  const assessments =
    await Assessment.find({
      controlSnapshot: {
        $elemMatch: {
          control:
            control._id,

          version: {
            $lt:
              control.version,
          },
        },
      },
    });


  const reason =
    `${control.controlId} changed to version ${control.version}. Assessment used an older control version.`;


  for (
    const assessment of assessments
  ) {

    const alreadyRecorded =
      assessment.staleReasons?.includes(
        reason
      );


    assessment.isStale =
      true;

    assessment.status =
      "stale";


    if (!alreadyRecorded) {
      assessment.staleReasons.push(
        reason
      );
    }


    await assessment.save();


    await recordAudit({
      assessment:
        assessment._id,

      action:
        "ASSESSMENT_MARKED_STALE",

      entityType:
        "Assessment",

      entityId:
        assessment._id,

      actor:
        "System",

      summary:
        `${assessment.name} marked stale because ${control.controlId} changed.`,

      metadata: {
        controlId:
          control.controlId,

        currentControlVersion:
          control.version,

        reason,
      },
    });
  }


  return assessments.length;
};