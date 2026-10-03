import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    evidenceType: {
      type: String,
      enum: [
        "document",
        "screenshot",
        "configuration",
        "report",
        "log",
        "other",
      ],
      default: "document",
    },

    reference: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "current",
        "needs_review",
        "outdated",
      ],
      default: "current",
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


const controlSchema = new mongoose.Schema(
  {
    controlId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "control",
        "process",
        "system",
      ],
      default: "control",
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

    department: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "under_review",
      ],
      default: "active",
    },

    evidence: {
      type: [evidenceSchema],
      default: [],
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    lastReviewedAt: {
      type: Date,
      default: null,
    },

    lastChangedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


const Control = mongoose.model(
  "Control",
  controlSchema
);

export default Control;