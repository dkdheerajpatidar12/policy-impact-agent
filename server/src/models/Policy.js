import mongoose from "mongoose";

const policySectionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
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

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    version: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    originalFileName: {
      type: String,
      default: "",
    },

    sourceType: {
      type: String,
      enum: ["text", "pdf", "docx", "manual"],
      default: "text",
    },

    sourceText: {
      type: String,
      required: true,
    },

    sections: {
      type: [policySectionSchema],
      default: [],
    },

    contentHash: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: String,
      default: "Reviewer",
    },
  },
  {
    timestamps: true,
  }
);

/*
 Prevent duplicate versions of the same policy.

 Example:

 Information Security Policy v1.0 ✅
 Information Security Policy v2.0 ✅

 Information Security Policy v1.0 again ❌
*/
policySchema.index(
  {
    name: 1,
    version: 1,
  },
  {
    unique: true,
  }
);

const Policy = mongoose.model("Policy", policySchema);

export default Policy;