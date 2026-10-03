import express from "express";
import multer from "multer";

import {
  createPolicy,
  getPolicies,
  getPolicyById,
  uploadPolicy,
} from "../controllers/policyController.js";


const router =
  express.Router();


const storage =
  multer.memoryStorage();


const upload =
  multer({
    storage,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },

    fileFilter: (
      req,
      file,
      callback
    ) => {
      const allowed =
        [
          ".pdf",
          ".docx",
          ".txt",
        ];


      const fileName =
        file.originalname
          .toLowerCase();


      const valid =
        allowed.some(
          (extension) =>
            fileName.endsWith(
              extension
            )
        );


      if (!valid) {
        return callback(
          new Error(
            "Only PDF, DOCX and TXT files are allowed."
          )
        );
      }


      callback(
        null,
        true
      );
    },
  });


router.post(
  "/",
  createPolicy
);


router.post(
  "/upload",
  upload.single(
    "file"
  ),
  uploadPolicy
);


router.get(
  "/",
  getPolicies
);


router.get(
  "/:id",
  getPolicyById
);


export default router;