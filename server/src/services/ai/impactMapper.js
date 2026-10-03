import ai from "./geminiClient.js";

const impactSchema = {
  type: "object",
  properties: {
    mappings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          requirementChangeId: {
            type: "string",
          },

          controlId: {
            type: "string",
          },

          confidence: {
            type: "number",
          },

          explanation: {
            type: "string",
          },

          missingContext: {
            type: "array",
            items: {
              type: "string",
            },
          },

          evidenceReviewRequired: {
            type: "boolean",
          },

          evidenceReviewReason: {
            type: "string",
          },
        },

        required: [
          "requirementChangeId",
          "controlId",
          "confidence",
          "explanation",
          "missingContext",
          "evidenceReviewRequired",
          "evidenceReviewReason",
        ],
      },
    },
  },

  required: ["mappings"],
};


export const generateImpactMappings = async ({
  changes,
  controls,
}) => {

  const changeData = changes.map(
    (change) => ({
      id: String(change._id),

      changeType:
        change.changeType,

      oldSection:
        change.oldSection || null,

      newSection:
        change.newSection || null,
    })
  );


  const controlData = controls.map(
    (control) => ({
      controlId:
        control.controlId,

      name:
        control.name,

      type:
        control.type,

      description:
        control.description,

      owner:
        control.owner,

      version:
        control.version,

      evidence:
        (control.evidence || []).map(
          (item) => ({
            title: item.title,

            description:
              item.description,

            status:
              item.status,

            lastUpdatedAt:
              item.lastUpdatedAt,
          })
        ),
    })
  );


  const prompt = `
You are a policy impact analysis assistant.

Your job is to identify which organizational controls,
processes, or systems MAY be affected by each policy
requirement change.

IMPORTANT RULES:

1. Use ONLY the supplied requirement changes and controls.
2. Never invent a control ID.
3. Do not claim formal compliance.
4. AI mappings are suggestions only.
5. Only create a mapping when there is a reasonable relationship.
6. A requirement may map to multiple controls.
7. A requirement may map to no controls.
8. confidence must be between 0 and 1.
9. Be concise and specific.
10. evidenceReviewRequired means the existing evidence may
need human review because of the changed requirement.
11. Do not say evidence is definitely invalid.
12. requirementChangeId must exactly match one supplied ID.
13. controlId must exactly match one supplied controlId.

REQUIREMENT CHANGES:

${JSON.stringify(changeData, null, 2)}

CONTROL REGISTER:

${JSON.stringify(controlData, null, 2)}
`;


  const interaction =
    await ai.interactions.create({

      model:
        process.env.GEMINI_MODEL ||
        "gemini-3.8-flash",

      input: prompt,

      response_format: {
        type: "text",
        mime_type:
          "application/json",
        schema: impactSchema,
      },

      generation_config: {
        thinking_level: "low",
      },

      store: false,
    });


  return JSON.parse(
    interaction.output_text
  );
};