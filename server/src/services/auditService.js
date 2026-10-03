import AuditLog from "../models/AuditLog.js";


export const recordAudit = async ({
  assessment = null,
  action,
  entityType,
  entityId = "",
  actor = "System",
  summary,
  before = null,
  after = null,
  metadata = {},
}) => {
  try {
    const log = await AuditLog.create({
      assessment,
      action,
      entityType,
      entityId:
        entityId
          ? String(entityId)
          : "",
      actor,
      summary,
      before,
      after,
      metadata,
    });

    return log;

  } catch (error) {
    console.error(
      "Audit logging failed:",
      error.message
    );

    return null;
  }
};