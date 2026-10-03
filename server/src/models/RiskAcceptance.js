import mongoose from "mongoose";

const riskAcceptanceSchema =
  new mongoose.Schema(
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

      reason: {
        type: String,
        required: true,
        trim: true,
      },

      reviewDate: {
        type: Date,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "active",
          "expired",
          "revoked",
        ],
        default: "active",
      },

      acceptedBy: {
        type: String,
        default: "Reviewer",
      },

      acceptedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

const RiskAcceptance =
  mongoose.model(
    "RiskAcceptance",
    riskAcceptanceSchema
  );

export default RiskAcceptance;