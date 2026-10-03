import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    entityType: {
      type: String,
      required: true,
      trim: true,
    },

    entityId: {
      type: String,
      default: "",
    },

    actor: {
      type: String,
      default: "System",
    },

    summary: {
      type: String,
      required: true,
    },

    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

auditLogSchema.index({
  assessment: 1,
  createdAt: -1,
});

const AuditLog = mongoose.model(
  "AuditLog",
  auditLogSchema
);

export default AuditLog;