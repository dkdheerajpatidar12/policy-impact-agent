import AuditLog from "../models/AuditLog.js";


export const getAuditLogs = async (
  req,
  res
) => {
  try {
    const filter = {};

    if (req.query.assessmentId) {
      filter.assessment =
        req.query.assessmentId;
    }

    if (req.query.action) {
      filter.action =
        req.query.action;
    }

    const logs =
      await AuditLog.find(filter)
        .populate(
          "assessment",
          "name status oldPolicyVersion newPolicyVersion"
        )
        .sort({
          createdAt: -1,
        })
        .limit(250);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });

  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch audit history.",
    });
  }
};