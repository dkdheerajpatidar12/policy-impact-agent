import "dotenv/config";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

import {
  logger,
} from "./src/utils/logger.js";


const PORT =
  process.env.PORT || 5000;


const startServer = async () => {
  try {
    await connectDB();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        logger.info(
          "Server started",
          {
            port: PORT,

            environment:
              process.env.NODE_ENV ||
              "development",
          }
        );
      }
    );

  } catch (error) {
    logger.error(
      "Server startup failed",
      {
        error:
          error.message,
      }
    );

    process.exit(1);
  }
};


startServer();