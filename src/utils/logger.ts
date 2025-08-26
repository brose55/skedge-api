import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // Only pretty-print in development
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:MM/dd/yyyy T HH:mm:ss",
            ignore: "pid,hostname",
            singleLine: false,
            messageFormat: false,
            // customPrettifiers: { ... } // add prettifiers here if needed
          },
        },
  base: {
    pid: false,
  },
});

export default logger;
