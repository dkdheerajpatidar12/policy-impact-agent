import crypto from "node:crypto";

import Policy from "../models/Policy.js";

import {
  extractPolicySections,
  extractTextFromPolicyFile,
  getPolicySourceType,
} from "../services/policyFileService.js";

import {
  recordAudit,
} from "../services/auditService.js";


// ======================================================
// CREATE POLICY MANUALLY
// ======================================================

export const createPolicy = async (
  req,
  res
) => {
  try {
    const {
      name,
      version,
      description = "",
      sourceText,
      sections = [],
      sourceType = "manual",
      originalFileName = "",
      uploadedBy = "Reviewer",
    } = req.body;


    if (
      !name ||
      !version ||
      !sourceText
    ) {
      return res.status(400).json({
        success: false,
        message:
          "name, version and sourceText are required.",
      });
    }


    const contentHash =
      crypto
        .createHash("sha256")
        .update(sourceText)
        .digest("hex");


    const parsedSections =
      sections.length > 0
        ? sections
        : extractPolicySections(
            sourceText
          );


    const policy =
      await Policy.create({
        name:
          name.trim(),

        version:
          version.trim(),

        description,

        originalFileName,

        sourceType,

        sourceText,

        sections:
          parsedSections,

        contentHash,

        uploadedBy,
      });


    await recordAudit({
      action:
        "POLICY_CREATED",

      entityType:
        "Policy",

      entityId:
        policy._id,

      actor:
        uploadedBy,

      summary:
        `${policy.name} v${policy.version} created.`,

      after:
        policy.toObject(),
    });


    return res.status(201).json({
      success: true,
      message:
        "Policy created successfully.",
      policy,
    });

  } catch (error) {
    console.error(
      "Create policy error:",
      error
    );


    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This policy version already exists.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create policy.",
    });
  }
};


// ======================================================
// UPLOAD POLICY FILE
// ======================================================

export const uploadPolicy = async (
  req,
  res
) => {
  try {
    const {
      name,
      version,
      description = "",
      uploadedBy = "Reviewer",
    } = req.body;


    if (
      !name ||
      !version
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Policy name and version are required.",
      });
    }


    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a policy file.",
      });
    }


    const existingPolicy =
      await Policy.findOne({
        name:
          name.trim(),

        version:
          version.trim(),
      });


    if (existingPolicy) {
      return res.status(409).json({
        success: false,
        message:
          "This policy version already exists.",
      });
    }


    const sourceText =
      await extractTextFromPolicyFile(
        req.file
      );


    if (!sourceText) {
      return res.status(400).json({
        success: false,
        message:
          "No readable text was found in this document.",
      });
    }


    const sections =
      extractPolicySections(
        sourceText
      );


    if (
      sections.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to identify policy content.",
      });
    }


    const contentHash =
      crypto
        .createHash("sha256")
        .update(sourceText)
        .digest("hex");


    const policy =
      await Policy.create({
        name:
          name.trim(),

        version:
          version.trim(),

        description,

        originalFileName:
          req.file.originalname,

        sourceType:
          getPolicySourceType(
            req.file.originalname
          ),

        sourceText,

        sections,

        contentHash,

        uploadedBy,
      });


    await recordAudit({
      action:
        "POLICY_UPLOADED",

      entityType:
        "Policy",

      entityId:
        policy._id,

      actor:
        uploadedBy,

      summary:
        `${policy.name} v${policy.version} uploaded from ${req.file.originalname}.`,

      after:
        policy.toObject(),

      metadata: {
        fileName:
          req.file.originalname,

        sourceType:
          policy.sourceType,

        sectionsDetected:
          sections.length,
      },
    });


    return res.status(201).json({
      success: true,

      message:
        "Policy uploaded successfully.",

      sectionsDetected:
        sections.length,

      policy,
    });

  } catch (error) {
    console.error(
      "Upload policy error:",
      error
    );


    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This policy version already exists.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to upload policy.",
    });
  }
};


// ======================================================
// GET POLICIES
// ======================================================

export const getPolicies = async (
  req,
  res
) => {
  try {
    const policies =
      await Policy.find()
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      success: true,
      count:
        policies.length,
      policies,
    });

  } catch (error) {
    console.error(
      "Get policies error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch policies.",
    });
  }
};


// ======================================================
// GET ONE POLICY
// ======================================================

export const getPolicyById = async (
  req,
  res
) => {
  try {
    const policy =
      await Policy.findById(
        req.params.id
      );


    if (!policy) {
      return res.status(404).json({
        success: false,
        message:
          "Policy not found.",
      });
    }


    return res.status(200).json({
      success: true,
      policy,
    });

  } catch (error) {
    console.error(
      "Get policy error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch policy.",
    });
  }
};