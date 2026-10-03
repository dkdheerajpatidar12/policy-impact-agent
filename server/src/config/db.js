import mongoose from "mongoose";
import dns from "node:dns";

import {
  logger,
} from "../utils/logger.js";


dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);


const connectDB = async () => {
  try {
    const connection =
      await mongoose.connect(
        process.env.MONGODB_URI
      );


    logger.info(
      "MongoDB connected",
      {
        host:
          connection.connection.host,
      }
    );

  } catch (error) {
    logger.error(
      "MongoDB connection failed",
      {
        error:
          error.message,
      }
    );

    throw error;
  }
};


export default connectDB;