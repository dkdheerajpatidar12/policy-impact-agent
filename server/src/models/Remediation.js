import mongoose from "mongoose";

const remediationSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },

    impactMapping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImpactMapping",
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "blocked",
        "completed",
        "cancelled",
      ],
      default: "open",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      enum: [
        "low",
        "medium",
        "high",
        "critical",
      ],
      default: "medium",
    },

    approved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: String,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Remediation = mongoose.model(
  "Remediation",
  remediationSchema
);

export default Remediation;