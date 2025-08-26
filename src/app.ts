import "dotenv/config";
import config from "config";
import connection from "./utils/connection";
import logger from "./utils/logger";
import createServer from "./utils/server";

// Dynamically load env file
// const envFile =
//   process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev";
// dotenv.config({ path: envFile });

// // Confirm it worked
// console.log("Loaded ENV:", envFile);
// console.log("Mongo URI:", process.env.MONGO_DB_URI);

console.log(process.env.MONGO_INITDB_ROOT_USERNAME);

// health check TODO:: delete
logger.info("hello");
logger.warn({ userId: "123" }, "something happened");
logger.error(new Error("kaboom"), "with stack");

const port = config.get<number>("port");

const app = createServer();

app.listen(port, async () => {
  logger.info(`App is running on http://localhost:${port}`);
  await connection();
});
