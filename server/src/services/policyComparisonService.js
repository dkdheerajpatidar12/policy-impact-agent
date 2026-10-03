const normalizeText = (text = "") => {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};


export const comparePolicySections = (
  oldSections = [],
  newSections = []
) => {

  const changes = [];

  // Create maps using sectionId
  const oldMap = new Map(
    oldSections.map((section) => [
      section.sectionId,
      section,
    ])
  );

  const newMap = new Map(
    newSections.map((section) => [
      section.sectionId,
      section,
    ])
  );


  // Check modified and removed sections
  for (const oldSection of oldSections) {

    const newSection = newMap.get(
      oldSection.sectionId
    );


    // Section removed
    if (!newSection) {

      changes.push({
        changeType: "removed",

        oldSection: {
          sectionId: oldSection.sectionId,
          title: oldSection.title || "",
          text: oldSection.text,
          page: oldSection.page ?? null,
        },

        newSection: null,

        summary:
          `Section ${oldSection.sectionId} was removed from the new policy.`,
      });

      continue;
    }


    // Section exists in both but text changed
    const oldText = normalizeText(
      oldSection.text
    );

    const newText = normalizeText(
      newSection.text
    );


    if (oldText !== newText) {

      changes.push({
        changeType: "modified",

        oldSection: {
          sectionId: oldSection.sectionId,
          title: oldSection.title || "",
          text: oldSection.text,
          page: oldSection.page ?? null,
        },

        newSection: {
          sectionId: newSection.sectionId,
          title: newSection.title || "",
          text: newSection.text,
          page: newSection.page ?? null,
        },

        summary:
          `Section ${oldSection.sectionId} changed between policy versions.`,
      });

    }
  }


  // Check newly added sections
  for (const newSection of newSections) {

    const oldSection = oldMap.get(
      newSection.sectionId
    );


    if (!oldSection) {

      changes.push({
        changeType: "added",

        oldSection: null,

        newSection: {
          sectionId: newSection.sectionId,
          title: newSection.title || "",
          text: newSection.text,
          page: newSection.page ?? null,
        },

        summary:
          `Section ${newSection.sectionId} was added in the new policy.`,
      });

    }
  }


  return changes;
};