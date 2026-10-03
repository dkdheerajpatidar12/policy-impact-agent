import mongoose from "mongoose";

const impactMappingSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },

    requirementChange: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequirementChange",
      required: true,
      index: true,
    },

    control: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Control",
      required: true,
    },

    controlId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    controlVersion: {
      type: Number,
      required: true,
    },

    impactStatus: {
      type: String,
      enum: [
        "possible",
        "confirmed",
        "not_affected",
      ],
      default: "possible",
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    explanation: {
      type: String,
      required: true,
      trim: true,
    },

    missingContext: {
      type: [String],
      default: [],
    },

    evidenceReviewRequired: {
      type: Boolean,
      default: false,
    },

    evidenceReviewReason: {
      type: String,
      default: "",
      trim: true,
    },

    reviewerDecision: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "corrected",
      ],
      default: "pending",
    },

    reviewerComment: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedBy: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    mappingSource: {
      type: String,
      enum: [
        "ai",
        "manual",
      ],
      default: "ai",
    },
  },
  {
    timestamps: true,
  }
);


/*
 Prevent the same requirement change from being
 mapped to the same control more than once.
*/
impactMappingSchema.index(
  {
    requirementChange: 1,
    control: 1,
  },
  {
    unique: true,
  }
);


const ImpactMapping = mongoose.model(
  "ImpactMapping",
  impactMappingSchema
);

export default ImpactMapping;