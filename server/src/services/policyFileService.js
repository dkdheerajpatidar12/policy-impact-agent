import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";


// ======================================================
// EXTRACT TEXT FROM FILE
// ======================================================

export const extractTextFromPolicyFile = async (
  file
) => {
  if (!file) {
    throw new Error(
      "Policy file is required."
    );
  }


  const fileName =
    file.originalname.toLowerCase();


  // TXT
  if (
    fileName.endsWith(".txt")
  ) {
    return file.buffer
      .toString("utf8")
      .trim();
  }


  // DOCX
  if (
    fileName.endsWith(".docx")
  ) {
    const result =
      await mammoth.extractRawText({
        buffer:
          file.buffer,
      });

    return result.value.trim();
  }


  // PDF
  if (
    fileName.endsWith(".pdf")
  ) {
    const parser =
      new PDFParse({
        data:
          file.buffer,
      });

    try {
      const result =
        await parser.getText();

      return (
        result.text || ""
      ).trim();

    } finally {
      await parser.destroy();
    }
  }


  throw new Error(
    "Unsupported file type."
  );
};


// ======================================================
// DETECT FILE TYPE
// ======================================================

export const getPolicySourceType = (
  fileName
) => {
  const lower =
    fileName.toLowerCase();

  if (
    lower.endsWith(".pdf")
  ) {
    return "pdf";
  }

  if (
    lower.endsWith(".docx")
  ) {
    return "docx";
  }

  if (
    lower.endsWith(".txt")
  ) {
    return "text";
  }

  return "manual";
};


// ======================================================
// CONVERT EXTRACTED TEXT TO POLICY SECTIONS
// ======================================================

export const extractPolicySections = (
  sourceText
) => {
  const cleanedText =
    sourceText
      .replace(/\r/g, "")
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();


  if (!cleanedText) {
    return [];
  }


  const lines =
    cleanedText
      .split("\n")
      .map(
        (line) =>
          line.trim()
      )
      .filter(Boolean);


  const sections = [];

  let currentSection =
    null;


  /*
    Matches headings like:

    1 Password Policy
    1.1 Password Security
    2.3.1 Access Control
  */
  const headingRegex =
    /^(\d+(?:\.\d+)*)(?:[.)])?\s+(.+)$/;


  for (
    const line of lines
  ) {
    const match =
      line.match(
        headingRegex
      );


    if (match) {
      if (currentSection) {
        sections.push({
          sectionId:
            currentSection.sectionId,

          title:
            currentSection.title,

          text:
            currentSection.body
              .join(" ")
              .trim() ||
            currentSection.title,

          page:
            null,
        });
      }


      currentSection = {
        sectionId:
          match[1],

        title:
          match[2].trim(),

        body: [],
      };


      continue;
    }


    if (currentSection) {
      currentSection.body.push(
        line
      );
    }
  }


  if (currentSection) {
    sections.push({
      sectionId:
        currentSection.sectionId,

      title:
        currentSection.title,

      text:
        currentSection.body
          .join(" ")
          .trim() ||
        currentSection.title,

      page:
        null,
    });
  }


  // If numbered sections were found
  if (
    sections.length > 0
  ) {
    return sections;
  }


  /*
    Fallback for documents with no
    numbered section headings.
  */

  const paragraphs =
    cleanedText
      .split(/\n\s*\n/)
      .map(
        (paragraph) =>
          paragraph
            .replace(
              /\s+/g,
              " "
            )
            .trim()
      )
      .filter(Boolean);


  if (
    paragraphs.length > 0
  ) {
    return paragraphs.map(
      (
        paragraph,
        index
      ) => ({
        sectionId:
          `P${index + 1}`,

        title:
          `Paragraph ${index + 1}`,

        text:
          paragraph,

        page:
          null,
      })
    );
  }


  return [
    {
      sectionId:
        "1",

      title:
        "Policy Content",

      text:
        cleanedText,

      page:
        null,
    },
  ];
};