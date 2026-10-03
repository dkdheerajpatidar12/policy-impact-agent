import test from "node:test";
import assert from "node:assert/strict";

import {
  extractPolicySections,
} from "../src/services/policyFileService.js";


test(
  "extracts numbered policy sections",
  () => {
    const text = `
1.1 Password Security
Passwords must contain at least 14 characters.

1.2 Multi-Factor Authentication
MFA is required for administrative accounts.

2.1 Database Backups
Production databases must be backed up every 24 hours.
`;


    const sections =
      extractPolicySections(
        text
      );


    assert.equal(
      sections.length,
      3
    );


    assert.equal(
      sections[0].sectionId,
      "1.1"
    );


    assert.equal(
      sections[1].sectionId,
      "1.2"
    );


    assert.equal(
      sections[2].sectionId,
      "2.1"
    );


    assert.match(
      sections[0].text,
      /14 characters/i
    );
  }
);