import test from "node:test";
import assert from "node:assert/strict";

import {
  comparePolicySections,
} from "../src/services/policyComparisonService.js";


test(
  "detects modified and added policy sections",
  () => {
    const oldSections = [
      {
        sectionId: "1.1",
        title: "Password Security",
        text:
          "Passwords must contain at least 8 characters.",
        page: 1,
      },

      {
        sectionId: "1.2",
        title: "MFA",
        text:
          "MFA is recommended.",
        page: 1,
      },
    ];


    const newSections = [
      {
        sectionId: "1.1",
        title: "Password Security",
        text:
          "Passwords must contain at least 14 characters.",
        page: 1,
      },

      {
        sectionId: "1.2",
        title: "MFA",
        text:
          "MFA is recommended.",
        page: 1,
      },

      {
        sectionId: "2.1",
        title: "Access Review",
        text:
          "Access must be reviewed every six months.",
        page: 2,
      },
    ];


    const changes =
      comparePolicySections(
        oldSections,
        newSections
      );


    assert.equal(
      changes.length,
      2
    );


    const modified =
      changes.find(
        (change) =>
          change.sectionId ===
            "1.1" ||
          change.newSection
            ?.sectionId === "1.1"
      );


    const added =
      changes.find(
        (change) =>
          change.newSection
            ?.sectionId === "2.1"
      );


    assert.ok(modified);

    assert.equal(
      modified.changeType,
      "modified"
    );


    assert.ok(added);

    assert.equal(
      added.changeType,
      "added"
    );
  }
);