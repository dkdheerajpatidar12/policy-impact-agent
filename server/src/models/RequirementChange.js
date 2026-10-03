import mongoose from "mongoose";

const sectionReferenceSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      default: null,
    },

    title: {
      type: String,
      default: "",
    },

    text: {
      type: String,
      default: "",
    },

    page: {
      type: Number,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const requirementChangeSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },

    changeType: {
      type: String,
      enum: [
        "added",
        "removed",
        "modified",
      ],
      required: true,
    },

    oldSection: {
      type: sectionReferenceSchema,
      default: null,
    },

    newSection: {
      type: sectionReferenceSchema,
      default: null,
    },

    summary: {
      type: String,
      default: "",
    },

    detectionMethod: {
      type: String,
      enum: [
        "deterministic",
        "ai",
      ],
      default: "deterministic",
    },

    reviewStatus: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const RequirementChange = mongoose.model(
  "RequirementChange",
  requirementChangeSchema
);

export default RequirementChange;