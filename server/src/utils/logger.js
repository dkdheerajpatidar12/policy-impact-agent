const writeLog = (
  level,
  message,
  metadata = {}
) => {
  const log = {
    timestamp:
      new Date().toISOString(),

    level,

    message,

    ...metadata,
  };

  const output =
    JSON.stringify(log);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
};


export const logger = {
  info: (
    message,
    metadata = {}
  ) => {
    writeLog(
      "info",
      message,
      metadata
    );
  },

  warn: (
    message,
    metadata = {}
  ) => {
    writeLog(
      "warn",
      message,
      metadata
    );
  },

  error: (
    message,
    metadata = {}
  ) => {
    writeLog(
      "error",
      message,
      metadata
    );
  },
};