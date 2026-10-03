import mongoose from "mongoose";

const controlSnapshotSchema = new mongoose.Schema(
  {
    control: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Control",
      required: true,
    },

    controlId: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const assessmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    oldPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: true,
    },

    newPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: true,
    },

    oldPolicyVersion: {
      type: String,
      required: true,
    },

    newPolicyVersion: {
      type: String,
      required: true,
    },

    controlSnapshot: {
      type: [controlSnapshotSchema],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "draft",
        "analyzing",
        "in_review",
        "completed",
        "failed",
        "stale",
      ],
      default: "draft",
    },

    isStale: {
      type: Boolean,
      default: false,
    },

    staleReasons: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: String,
      default: "Reviewer",
    },

    reviewedBy: {
      type: String,
      default: "",
    },

    analysisStartedAt: {
      type: Date,
      default: null,
    },

    analysisCompletedAt: {
      type: Date,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Assessment = mongoose.model(
  "Assessment",
  assessmentSchema
);

export default Assessment;