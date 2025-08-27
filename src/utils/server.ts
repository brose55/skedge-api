import express from "express";
import deserializeUser from "../middleware/deserializeUser";
import router from "../routes";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "@/middleware/cors";

function createServer() {
  const app = express();

  app.use(corsMiddleware());

  app.use(cookieParser());

  app.use(express.json());

  app.use(deserializeUser);

  app.use(router);

  return app;
}

export default createServer;
