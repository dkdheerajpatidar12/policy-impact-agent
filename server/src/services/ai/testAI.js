import ai from "./geminiClient.js";

export const testAIConnection = async () => {
  const response = await ai.interactions.create({
    model:
      process.env.GEMINI_MODEL ||
      "gemini-3.8-flash",

    input:
      "Reply with exactly: AI connection working",

    store: false,
  });

  return response.output_text;
};